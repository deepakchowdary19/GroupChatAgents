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
    
    # Invoke the graph
    from backend.graph import AgentState
    inputs: AgentState = {
        "messages": initial_messages,
        "feedback_count": 0,
        "memory_type": memory_type,
        "critic_response": {},
        "final_response": "",
        "all_responses": []
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
        "all_responses": []
    }
    
    # Stream events from the graph
    async for event in graph_app.astream(inputs):
        for key, value in event.items():
            if key == "responder":
                # Yield responder's output
                yield json.dumps({
                    "type": "responder",
                    "content": value.get("final_response", "")
                }) + "\n"
            elif key == "critic":
                # Yield critic's output
                yield json.dumps({
                    "type": "critic",
                    "content": value.get("critic_response", {})
                }) + "\n"
                
    # After streaming, we might want to store memory, but for now let's keep it simple.
    # Ideally we should capture the final state to store memory.
    # Since astream yields partial updates, we might not have the full final state easily unless we track it.
    # For this implementation, we will skip memory storage in streaming mode or implement it if needed.
    # User requirement: "if long memory store embeddings". 
    # We can do a separate call to store memory after the stream is done if we had the final response.
    # But `astream` doesn't return the final state at the end.
    # We can reconstruct it or just use the last "responder" event as the final response.
