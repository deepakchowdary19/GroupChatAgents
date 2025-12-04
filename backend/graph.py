from typing import Annotated, List, Dict, Any, TypedDict, Optional
import operator
from langgraph.graph import StateGraph, END
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from backend.agents.critic import create_critic_agent
from backend.llm import get_llm
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

MAX_REVISION_ATTEMPTS = 3  # Max number of retry attempts (so total responses = initial + 3 retries = 4)

class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], operator.add]
    feedback_count: int
    memory_type: str
    critic_response: Dict[str, Any]
    final_response: str
    all_responses: Annotated[List[str], operator.add]
    revision_history: Annotated[List[Dict[str, Any]], operator.add]
    memory_context: Optional[str]  # Retrieved memory context

def responder_node(state: AgentState):
    messages = state['messages']
    feedback_count = state.get('feedback_count', 0)
    critic_response = state.get('critic_response', {})
    memory_context = state.get('memory_context', '')
    
    print(f"[RESPONDER] Starting iteration {feedback_count + 1} of {MAX_REVISION_ATTEMPTS}")
    
    # Extract memory context from SystemMessages if present
    if not memory_context:
        for msg in messages:
            if isinstance(msg, SystemMessage) and 'Relevant memories:' in str(msg.content):
                memory_context = msg.content
                print(f"[RESPONDER] Found memory context in messages: {memory_context[:100]}...")
                break
    
    llm = get_llm()
    
    from datetime import datetime
    current_date = datetime.now().strftime("%B %d, %Y")
    
    # Build memory section if available
    memory_section = ""
    if memory_context:
        memory_section = f"""
## YOUR MEMORY OF PAST CONVERSATIONS:
{memory_context}

IMPORTANT: Use this memory to answer questions about past conversations. If the user asks "what did we discuss" or "what topics did we talk about", refer to these memories!
"""
    
    if feedback_count > 0 and critic_response:
        feedback = critic_response.get('feedback', '')
        evidence = critic_response.get('evidence', [])
        sources = critic_response.get('sources', [])
        
        evidence_text = "\n".join([f"- {e}" for e in evidence]) if evidence else ""
        sources_text = "\n".join([f"- {s}" for s in sources]) if sources else ""
        
        system_prompt = f"""You are an expert AI assistant. Today's date is {current_date}.
{memory_section}
Your previous response needed improvement. This is revision attempt {feedback_count + 1} of {MAX_REVISION_ATTEMPTS}.

Critic's Feedback: {feedback}

{f"Evidence Found:" + chr(10) + evidence_text if evidence_text else ""}
{f"Sources:" + chr(10) + sources_text if sources_text else ""}

IMPORTANT INSTRUCTIONS:
1. Generate a NEW, COMPLETE answer to the user's original question
2. Address the critic's feedback points
3. If the user is asking about past conversations, USE YOUR MEMORY above
4. DO NOT evaluate your own response or say "This is a great response"
5. DO NOT apologize or say you cannot generate a response
6. Just answer the question directly with accurate information
7. Use markdown formatting for readability

Generate your improved answer now:"""
    else:
        system_prompt = f"""You are an expert AI assistant with deep knowledge and analytical capabilities.
Today's date is {current_date}.
{memory_section}
Your core qualities:
- Provide accurate, well-researched, and comprehensive responses
- Use clear structure with markdown formatting (headers, lists, code blocks)
- Be thorough yet concise - cover key points without unnecessary verbosity
- Include relevant examples, explanations, and practical insights
- When web search results are provided, base your answer on that current information
- IMPORTANT: When asked about past conversations or topics discussed, USE YOUR MEMORY section above!

Format your responses professionally using:
- **Bold** for emphasis
- `code` for technical terms
- ```language for code blocks
- - Bullet points for lists
- ## Headers for sections when appropriate"""
    
    user_query = ""
    for msg in reversed(messages):
        if hasattr(msg, 'type') and msg.type == 'human':
            content = msg.content
            user_query = content.lower() if isinstance(content, str) else ""
            break
    
    # Keywords that indicate memory/recall questions - DO NOT web search for these
    memory_keywords = [
        'remember', 'memory', 'earlier', 'before', 'we discussed', 'we talked', 'we spoke',
        'topics we', 'what did we', 'past conversation', 'previous', 'last time', 
        'you told me', 'i told you', 'mentioned', 'our conversation'
    ]
    is_memory_question = any(keyword in user_query for keyword in memory_keywords)
    
    if is_memory_question:
        print(f"[RESPONDER] Query: '{user_query[:100]}...' | Memory question detected - using stored memory, not web search")
    
    search_keywords = [
        'news', 'latest', 'today', 'current', 'recent', 'now', 'update', 'happening',
        'yesterday', 'last night', 'this week', 'this month', 'this year', '2024', '2025',
        'match', 'game', 'score', 'result', 'won', 'lost', 'cricket', 'football', 'sports',
        'weather', 'stock', 'price', 'election', 'breaking', 'announced', 'released'
    ]
    # Only search web if it's not a memory question
    needs_search = not is_memory_question and any(keyword in user_query for keyword in search_keywords)
    print(f"[RESPONDER] Query: '{user_query[:100]}...' | Needs web search: {needs_search}")
    
    if needs_search:
        try:
            from langchain_tavily import TavilySearch
            from backend.config import TAVILY_API_KEY
            import os
            
            if TAVILY_API_KEY:
                print(f"[RESPONDER] Performing web search for: '{user_query[:100]}...'")
                os.environ["TAVILY_API_KEY"] = TAVILY_API_KEY
                search_tool = TavilySearch(max_results=5)
                search_response = search_tool.invoke(user_query)
                
                # Tavily returns {'results': [...]} format
                if isinstance(search_response, dict):
                    search_results = search_response.get('results', [])
                elif isinstance(search_response, list):
                    search_results = search_response
                else:
                    search_results = []
                
                print(f"[RESPONDER] Got {len(search_results)} search results")
                
                from datetime import datetime
                current_date = datetime.now().strftime("%B %d, %Y")
                search_context = f"\n\n## IMPORTANT - Current Information from Web Search (Today is {current_date} - use this data!):\n"
                result_count = 0
                for result in search_results:
                    if isinstance(result, dict):
                        content = result.get('content', '')
                        title = result.get('title', '')
                        url = result.get('url', '')
                        if content or title:
                            result_count += 1
                            # Escape curly braces to prevent template parsing errors
                            safe_title = title.replace('{', '{{').replace('}', '}}') if title else ''
                            safe_content = content.replace('{', '{{').replace('}', '}}') if content else ''
                            search_context += f"\n### Result {result_count}: {safe_title}\n"
                            if safe_content:
                                search_context += f"{safe_content[:800]}\n"
                            if url:
                                search_context += f"(Source: {url})\n"
                
                if result_count > 0:
                    search_context += f"\n\n**CRITICAL INSTRUCTION: Your answer MUST be based on the search results above. Today is {current_date}. This is current, real-time information. Do NOT use outdated training data or old match results.**\n"
                    system_prompt += search_context
                    print(f"[RESPONDER] Added {result_count} search results to context")
                else:
                    print("[RESPONDER] No valid search results found")
            else:
                print("[RESPONDER] TAVILY_API_KEY not configured")
        except Exception as e:
            print(f"[RESPONDER] Search error: {type(e).__name__}: {e}")
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        MessagesPlaceholder(variable_name="messages"),
    ])
    chain = prompt | llm
    
    try:
        response = chain.invoke({"messages": messages})
        print(f"[RESPONDER] LLM Response type: {type(response)}")
        print(f"[RESPONDER] LLM Response content type: {type(response.content) if hasattr(response, 'content') else 'no content attr'}")
        print(f"[RESPONDER] LLM Response preview: {str(response.content)[:200] if hasattr(response, 'content') else str(response)[:200]}...")
        
        response_text = response.content if isinstance(response.content, str) else str(response.content)
        
        if not response_text or response_text.strip() == "":
            print("[RESPONDER] WARNING: Empty response from LLM!")
            response_text = "I apologize, but I was unable to generate a response. Please try again."
    except Exception as e:
        print(f"[RESPONDER] LLM Error: {type(e).__name__}: {e}")
        response_text = f"Error generating response: {str(e)}"
    
    revision_entry = {
        "iteration": feedback_count + 1,
        "response": response_text[:500],
        "had_feedback": feedback_count > 0
    }
    
    return {
        "messages": [response], 
        "final_response": response_text,
        "all_responses": [response_text],
        "revision_history": [revision_entry]
    }

def critic_node(state: AgentState):
    messages = state['messages']
    feedback_count = state.get('feedback_count', 0)
    memory_context = state.get('memory_context', '')
    
    print(f"[CRITIC] Evaluating response (iteration {feedback_count + 1})")
    
    last_message = messages[-1]
    
    user_message = ""
    for msg in reversed(messages[:-1]):
        if isinstance(msg, HumanMessage):
            content = msg.content
            user_message = content if isinstance(content, str) else str(content)
            break
            
    if not user_message:
        user_message = "Unknown query"
    
    # Check if memory was provided to the assistant
    has_memory = bool(memory_context)
    for msg in messages:
        if isinstance(msg, SystemMessage) and 'Relevant memories:' in str(msg.content):
            has_memory = True
            memory_context = msg.content
            break

    critic_agent = create_critic_agent()
    
    answer_content = last_message.content
    answer_str = answer_content if isinstance(answer_content, str) else str(answer_content)
    
    # Build context for critic
    evaluation_context = f"This is evaluation iteration {feedback_count + 1} of {MAX_REVISION_ATTEMPTS}."
    if has_memory:
        evaluation_context += f"""

IMPORTANT - MEMORY WAS PROVIDED TO THE ASSISTANT:
{memory_context}

If the user is asking about past conversations/topics and the assistant claims to have no memory or doesn't reference the memories above, this is a FAILURE. The assistant HAD memory available and should have used it!
"""
    
    try:
        critique = critic_agent.evaluate(
            question=user_message,
            answer=answer_str,
            context=evaluation_context
        )
    except Exception as e:
        critique = {
            "verdict": "error",
            "feedback": f"Critic error: {str(e)}",
            "evidence": [],
            "sources": []
        }
    
    print(f"[CRITIC] Verdict: {critique.get('verdict', 'unknown')}")
        
    return {
        "critic_response": critique,
        "feedback_count": feedback_count + 1
    }

def check_critique(state: AgentState):
    critic_response = state.get('critic_response', {})
    feedback_count = state.get('feedback_count', 0)
    
    raw_verdict = critic_response.get('verdict', '')
    verdict = raw_verdict.lower().strip() if isinstance(raw_verdict, str) else ''
    
    print(f"[CHECK_CRITIQUE] feedback_count={feedback_count}, verdict='{verdict}'")
    
    if feedback_count > MAX_REVISION_ATTEMPTS:
        print(f"[CHECK_CRITIQUE] Max revisions ({MAX_REVISION_ATTEMPTS}) exceeded ({feedback_count} attempts). Ending loop.")
        return "end"
    
    approved_verdicts = ['good', 'approved', 'acceptable', 'pass', 'ok', 'correct', 'accurate', 'satisfactory']
    if verdict in approved_verdicts:
        print(f"[CHECK_CRITIQUE] Response approved with verdict: '{verdict}'")
        return "end"
    
    revision_verdicts = ['needs_revision', 'revise', 'improve', 'needs improvement', 'needs_improvement', 
                         'incorrect', 'wrong', 'incomplete', 'inaccurate', 'poor', 'bad', 'fail', 'rejected']
    if verdict in revision_verdicts:
        print(f"[CHECK_CRITIQUE] Needs revision (verdict: '{verdict}'). Attempt {feedback_count} of {MAX_REVISION_ATTEMPTS}")
        return "retry"
    
    if verdict == 'error':
        print(f"[CHECK_CRITIQUE] Error occurred. Ending to prevent issues.")
        return "end"
    
    if not verdict:
        print(f"[CHECK_CRITIQUE] Empty/missing verdict. Conservative: treating as needs_revision.")
        return "retry"
    
    print(f"[CHECK_CRITIQUE] Unknown verdict '{verdict}'. Conservative: treating as needs_revision.")
    return "retry"

workflow = StateGraph(AgentState)

workflow.add_node("responder", responder_node)
workflow.add_node("critic", critic_node)

workflow.set_entry_point("responder")

workflow.add_edge("responder", "critic")

workflow.add_conditional_edges(
    "critic",
    check_critique,
    {
        "retry": "responder",
        "end": END
    }
)

app = workflow.compile()
