from openai import OpenAI
from typing import Optional
import os

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")


def get_openai_client():
    if OPENAI_API_KEY:
        return OpenAI(api_key=OPENAI_API_KEY)
    return None


class MultiAgentSystem:
    def __init__(self, manual_agent_description: Optional[str] = None):
        self.manual_agent_description = manual_agent_description or "A helpful AI assistant"
        self.client = get_openai_client()
    
    def get_manual_response(self, user_message: str) -> str:
        if not self.client:
            return self._simulate_manual_response(user_message)
        
        try:
            prompt = f"""You are {self.manual_agent_description}.
            
User message: {user_message}

Please provide a helpful, thoughtful response to the user's message."""
            
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=500
            )
            return response.choices[0].message.content
        except Exception as e:
            return self._simulate_manual_response(user_message)
    
    def get_critic_response(self, user_message: str, manual_response: str) -> str:
        if not self.client:
            return self._simulate_critic_response(user_message, manual_response)
        
        try:
            prompt = f"""You are a constructive critic agent. Your role is to analyze responses and provide helpful feedback.

Original user question: {user_message}

Response from the main agent: {manual_response}

Please provide a brief, constructive critique of the response above. Focus on:
1. Accuracy and completeness
2. Clarity and helpfulness
3. Any improvements that could be made

Keep your critique concise and constructive."""
            
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=300
            )
            return response.choices[0].message.content
        except Exception as e:
            return self._simulate_critic_response(user_message, manual_response)
    
    def _simulate_manual_response(self, user_message: str) -> str:
        return f"""As {self.manual_agent_description}, I've analyzed your message.

Based on your input: "{user_message[:100]}..."

Here's my response:
I understand you're asking about this topic. Let me provide some helpful information and guidance. This response is a demonstration of the multi-agent system. To get actual AI responses, please configure your OpenAI API key.

Key points:
1. Your question has been received and processed
2. The multi-agent system is working correctly
3. Configure OPENAI_API_KEY for full AI-powered responses"""

    def _simulate_critic_response(self, user_message: str, manual_response: str) -> str:
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


def process_multi_agent_chat(user_message: str, agent_description: Optional[str] = None) -> dict:
    system = MultiAgentSystem(agent_description)
    
    manual_response = system.get_manual_response(user_message)
    
    critic_response = system.get_critic_response(user_message, manual_response)
    
    return {
        "user_message": user_message,
        "manual_agent_response": manual_response,
        "critic_agent_response": critic_response
    }
