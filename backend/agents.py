"""Multi-agent orchestration for chat system."""
from typing import Optional, List
from backend.llm import LLMOrchestrator
from backend.memory import format_memories_for_prompt


class MultiAgentSystem:
    """Orchestrates multiple agents (Manual + Critic) for chat responses."""
    
    def __init__(self, manual_agent_description: Optional[str] = None, 
                 conversation_history: Optional[list] = None, 
                 memories: Optional[List[str]] = None):
        self.manual_agent_description = manual_agent_description or "A helpful AI assistant"
        self.conversation_history = conversation_history or []
        self.memories = memories or []
        self.llm = LLMOrchestrator()
    
    def get_manual_response(self, user_message: str) -> str:
        """Get response from manual agent."""
        system_prompt = f"""You are {self.manual_agent_description}. Respond naturally and professionally. Be direct, concise, and practical. Don't introduce yourself or explain what you're doing - just provide your response.
            
Memory from previous conversations:
{format_memories_for_prompt(self.memories)}"""
        
        messages = self.conversation_history.copy()
        messages.append({"role": "user", "content": user_message})
        messages.insert(0, {"role": "system", "content": system_prompt})
        
        response = self.llm.get_response(messages, max_tokens=500)
        
        if response:
            return response
        
        return self._simulate_manual_response(user_message)
    
    def get_critic_response(self, user_message: str, manual_response: str) -> str:
        """Get critique from critic agent."""
        system_prompt = """You are a thoughtful reviewer. Review responses critically but constructively. Provide brief feedback focused on practical improvements. Don't explain what you're doing - just give your feedback."""
        
        prompt = f"""Question: {user_message}

Response: {manual_response}

Feedback:"""
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ]
        
        response = self.llm.get_response(messages, max_tokens=300)
        
        if response:
            return response
        
        return self._simulate_critic_response(user_message, manual_response)
    
    def _simulate_manual_response(self, user_message: str) -> str:
        """Fallback simulated response for manual agent."""
        return f"""As {self.manual_agent_description}, I've analyzed your message.

Based on your input: "{user_message[:100]}..."

Here's my response:
I understand you're asking about this topic. Let me provide some helpful information and guidance. This response is a demonstration of the multi-agent system. To get actual AI responses, please configure your OpenAI API key.

Key points:
1. Your question has been received and processed
2. The multi-agent system is working correctly
3. Configure OPENAI_API_KEY for full AI-powered responses"""
    
    def _simulate_critic_response(self, user_message: str, manual_response: str) -> str:
        """Fallback simulated response for critic agent."""
        return f"""Critic Agent Analysis:

Reviewing the response to: "{user_message[:50]}..."

Observations:
1. The response addresses the user's query appropriately
2. The structure is clear and organized
3. Key points are highlighted effectively

Suggestions for improvement:
- Consider adding more specific examples
- The response could benefit from additional context
- Overall, the response is adequate but could be enhanced with more detail

Note: For full AI-powered critique, configure your OpenAI API key."""


def process_multi_agent_chat(user_message: str, agent_description: Optional[str] = None, 
                            conversation_history: Optional[list] = None, 
                            memories: Optional[List[str]] = None) -> dict:
    """Process a user message through the multi-agent system."""
    system = MultiAgentSystem(agent_description, conversation_history, memories)
    
    manual_response = system.get_manual_response(user_message)
    critic_response = system.get_critic_response(user_message, manual_response)
    
    return {
        "user_message": user_message,
        "manual_agent_response": manual_response,
        "critic_agent_response": critic_response
    }


# Keep extract_key_facts for backward compatibility
from backend.memory import extract_key_facts
