"""Critic agent orchestration for chat system using LangGraph."""
from typing import Optional, Dict, Any, List, AsyncGenerator
from langchain_core.messages import HumanMessage, SystemMessage
from backend.graph import app as graph_app
from backend.memory import LongTermMemoryStore
import json

def process_multi_agent_chat(
    user_message: str,
    agent_id: str,
    agent_description: Optional[str] = None, 
    conversation_history: Optional[list] = None,
    store_memory: bool = True,
    memory_type: str = "long"
) -> Dict[str, Any]:
    """Process a user message through the LangGraph workflow.
    
    Args:
        user_message: The user's message
        agent_id: Unique identifier for the agent
        agent_description: Optional description
        conversation_history: Recent conversation messages
        store_memory: Whether to store this conversation
        memory_type: "short" or "long"
        
    Returns:
        Dictionary with user message, manual agent response, and critic response
    """
    
    # Context retrieval
    context = ""
    if memory_type == "long":
        # Initialize memory store
        try:
            memory_store = LongTermMemoryStore(
                memory_collection_name=f"agent_{agent_id}_memory"
            )
            memories = memory_store.search(query=user_message, k=3)
            if memories:
                context = "Relevant memories:\n" + "\n".join([
                    f"- {mem['content'][:150]}..." for mem in memories
                ])
        except Exception as e:
            print(f"Memory initialization/retrieval error: {e}")
            
    elif memory_type == "short":
        # Use recent conversation history as context
        if conversation_history:
            context = "Recent conversation:\n" + "\n".join([
                f"{msg['role']}: {msg['content'][:100]}..." 
                for msg in conversation_history[-5:]
            ])
            
    # Prepare initial messages
    initial_messages = []
    if context:
        initial_messages.append(SystemMessage(content=f"Context for this conversation:\n{context}"))
    
    if agent_description:
        initial_messages.append(SystemMessage(content=f"Your role: {agent_description}"))
        
    initial_messages.append(HumanMessage(content=user_message))
    
    from backend.graph import AgentState
    inputs: AgentState = {
        "messages": initial_messages,
        "feedback_count": 0,
        "memory_type": memory_type,
        "critic_response": {},
        "final_response": "",
        "all_responses": [],
        "revision_history": [],
        "memory_context": context if context else None  # Pass memory context to responder
    }
    
    final_state = graph_app.invoke(inputs)
    
    final_response = final_state.get("final_response", "")
    all_responses = final_state.get("all_responses", [])
    critic_response = final_state.get("critic_response", {})
    
    # Store in memory if enabled and long term
    if store_memory and memory_type == "long":
        try:
            memory_store = LongTermMemoryStore(
                memory_collection_name=f"agent_{agent_id}_memory"
            )
            conversation_text = f"User: {user_message}\nResponse: {final_response}"
            memory_store.store(
                [conversation_text], 
                [{"type": "conversation", "agent_id": agent_id}]
            )
        except Exception as e:
            print(f"Memory storage error (continuing without memory): {e}")

    return {
        "user_message": user_message,
        "manual_agent_response": final_response,
        "critic_agent_response": critic_response,
        "all_responses": all_responses  # Include all iterations
    }

async def stream_multi_agent_chat(
    user_message: str,
    agent_id: str,
    agent_description: Optional[str] = None, 
    conversation_history: Optional[list] = None,
    store_memory: bool = True,
    memory_type: str = "long"
) -> AsyncGenerator[str, None]:
    """Stream the multi-agent chat process using SSE."""
    
    # Context retrieval (same as above)
    context = ""
    if memory_type == "long":
        try:
            memory_store = LongTermMemoryStore(
                memory_collection_name=f"agent_{agent_id}_memory"
            )
            memories = memory_store.search(query=user_message, k=3)
            if memories:
                context = "Relevant memories:\n" + "\n".join([
                    f"- {mem['content'][:150]}..." for mem in memories
                ])
        except Exception as e:
            print(f"Memory initialization/retrieval error: {e}")
            
    elif memory_type == "short":
        if conversation_history:
            context = "Recent conversation:\n" + "\n".join([
                f"{msg['role']}: {msg['content'][:100]}..." 
                for msg in conversation_history[-5:]
            ])
            
    initial_messages = []
    if context:
        initial_messages.append(SystemMessage(content=f"Context for this conversation:\n{context}"))
    if agent_description:
        initial_messages.append(SystemMessage(content=f"Your role: {agent_description}"))
    initial_messages.append(HumanMessage(content=user_message))
    
    from backend.graph import AgentState
    inputs: AgentState = {
        "messages": initial_messages,
        "feedback_count": 0,
        "memory_type": memory_type,
        "critic_response": {},
        "final_response": "",
        "all_responses": [],
        "revision_history": [],
        "memory_context": context if context else None  # Pass memory context to responder
    }
    
    # Track iteration count and responses
    iteration = 0
    all_responses = []  # Track all responses to pick best one
    current_response = ""
    
    # Stream events from the graph
    async for event in graph_app.astream(inputs):
        print(f"[ORCHESTRATOR] Event keys: {event.keys()}")
        for key, value in event.items():
            print(f"[ORCHESTRATOR] Key: {key}, Value keys: {value.keys() if isinstance(value, dict) else type(value)}")
            if key == "responder":
                iteration += 1
                current_response = value.get("final_response", "")
                print(f"[ORCHESTRATOR] Responder output - final_response length: {len(current_response)}")
                print(f"[ORCHESTRATOR] Responder output preview: {current_response[:200] if current_response else 'EMPTY'}...")
                
                # Track all non-empty, non-apology responses
                is_valid_response = (
                    current_response and 
                    current_response.strip() and
                    "I apologize, but I was unable to generate a response" not in current_response
                )
                if is_valid_response:
                    all_responses.append(current_response)
                
                # Yield responder's output with iteration info
                yield json.dumps({
                    "type": "responder",
                    "iteration": iteration,
                    "content": current_response,
                    "is_revision": iteration > 1
                }) + "\n"
            elif key == "critic":
                # Yield critic's output with iteration info
                critic_resp = value.get("critic_response", {})
                print(f"[ORCHESTRATOR] Critic output: {critic_resp}")
                yield json.dumps({
                    "type": "critic",
                    "iteration": iteration,
                    "content": critic_resp,
                    "verdict": critic_resp.get("verdict", "unknown"),
                    "feedback": critic_resp.get("feedback", "")
                }) + "\n"
    
    # Pick the best response: prefer last valid response, fallback to any valid, then current
    if all_responses:
        final_response = all_responses[-1]  # Use last valid response
    else:
        final_response = current_response  # Fallback to whatever we have
    
    print(f"[ORCHESTRATOR] Final response selection: {len(all_responses)} valid responses, using: {final_response[:100] if final_response else 'EMPTY'}...")
    
    # Yield final event to signal completion
    yield json.dumps({
        "type": "complete",
        "total_iterations": iteration,
        "final_response": final_response
    }) + "\n"
    
    # Store memory after streaming is complete
    if store_memory and memory_type == "long" and final_response:
        try:
            memory_store = LongTermMemoryStore(
                memory_collection_name=f"agent_{agent_id}_memory"
            )
            conversation_text = f"User: {user_message}\nResponse: {final_response}"
            memory_store.store(
                [conversation_text], 
                [{"type": "conversation", "agent_id": agent_id}]
            )
        except Exception as e:
            print(f"Memory storage error: {e}")
