from typing import Annotated, List, Dict, Any, TypedDict, Union
import operator
from langgraph.graph import StateGraph, END
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from backend.agents.critic import create_critic_agent
from backend.llm import get_llm
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

# Define the state of the agent
class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], operator.add]
    feedback_count: int
    memory_type: str
    critic_response: Dict[str, Any]
    final_response: str
    all_responses: Annotated[List[str], operator.add]  # Track all iterations

# Define the nodes
def responder_node(state: AgentState):
    messages = state['messages']
    feedback_count = state.get('feedback_count', 0)
    critic_response = state.get('critic_response', {})
    
    print(f"[RESPONDER] Starting iteration {feedback_count + 1}")
    
    llm = get_llm()
    
    # Build the system prompt
    if feedback_count > 0 and critic_response:
        feedback = critic_response.get('feedback', '')
        system_prompt = (
            "You are a helpful AI assistant. "
            "You have received feedback from a critic on your previous response. "
            f"Feedback: {feedback}. "
            "Please improve your response based on this feedback."
        )
    else:
        system_prompt = (
            "You are a helpful AI assistant. "
            "Provide clear, accurate, and helpful responses."
        )
    
    # Check if user is asking about current events/news
    user_query = ""
    for msg in reversed(messages):
        if hasattr(msg, 'type') and msg.type == 'human':
            content = msg.content
            user_query = content.lower() if isinstance(content, str) else ""
            break
    
    # If asking about news/current events, use Tavily search
    needs_search = any(keyword in user_query for keyword in ['news', 'cricket', 'latest', 'today', 'current', 'recent', 'now'])
    
    if needs_search:
        try:
            from langchain_tavily import TavilySearch
            from backend.config import TAVILY_API_KEY
            import os
            
            if TAVILY_API_KEY:
                os.environ["TAVILY_API_KEY"] = TAVILY_API_KEY
                search_tool = TavilySearch(max_results=3)
                search_results = search_tool.invoke(user_query)
                
                # Add search results to the system prompt
                search_context = "\n\nHere is current information from the web:\n"
                for result in search_results:
                    if isinstance(result, dict):
                        search_context += f"- {result.get('content', '')}\n"
                
                system_prompt += search_context
        except Exception as e:
            print(f"Search error: {e}")
    
    # Generate response
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        MessagesPlaceholder(variable_name="messages"),
    ])
    chain = prompt | llm
    response = chain.invoke({"messages": messages})
    
    response_text = response.content if isinstance(response.content, str) else str(response.content)
    
    # Return only the new message to be added (operator.add will append it)
    return {
        "messages": [response], 
        "final_response": response_text,
        "all_responses": [response_text]
    }

def critic_node(state: AgentState):
    messages = state['messages']
    feedback_count = state.get('feedback_count', 0)
    
    print(f"[CRITIC] Evaluating response (feedback_count before increment: {feedback_count})")
    
    # The last message should be the responder's response
    last_message = messages[-1]
    
    # We need the user's original question. 
    # Assuming the second to last message is the user's input if it's a simple turn,
    # but with history it might be different.
    # Let's find the last HumanMessage.
    user_message = ""
    for msg in reversed(messages[:-1]):
        if isinstance(msg, HumanMessage):
            content = msg.content
            user_message = content if isinstance(content, str) else str(content)
            break
            
    if not user_message:
        # Fallback if no user message found (shouldn't happen in normal flow)
        user_message = "Unknown query"

    critic_agent = create_critic_agent()
    
    # Extract answer content safely
    answer_content = last_message.content
    answer_str = answer_content if isinstance(answer_content, str) else str(answer_content)
    
    try:
        critique = critic_agent.evaluate(
            question=user_message,
            answer=answer_str,
            context="" # Context could be passed here if we had it in state
        )
    except Exception as e:
        critique = {
            "verdict": "error",
            "feedback": f"Critic error: {str(e)}",
            "score": 0
        }
        
    return {
        "critic_response": critique,
        "feedback_count": state.get('feedback_count', 0) + 1
    }

def check_critique(state: AgentState):
    critic_response = state.get('critic_response', {})
    feedback_count = state.get('feedback_count', 0)
    
    print(f"[CHECK_CRITIQUE] feedback_count={feedback_count}, verdict={critic_response.get('verdict')}")
    
    # Check if critique is good enough or if we reached max iterations
    if feedback_count >= 3 or critic_response.get('verdict') == 'good':
        print(f"[CHECK_CRITIQUE] Ending: feedback_count={feedback_count} >= 3 or verdict='good'")
        return "end"
    
    print(f"[CHECK_CRITIQUE] Retrying: feedback_count={feedback_count} < 3 and verdict != 'good'")
    return "retry"

# Build the workflow graph
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
