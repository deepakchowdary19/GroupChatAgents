from openai import OpenAI
from typing import Optional, List
import os
import re
import sys
from backend.config import OPENAI_API_KEY, GEMINI_API_KEY


def extract_key_facts(message: str) -> List[str]:
    """Extract key facts from a message for memory."""
    facts = []
    
    # Extract patterns like "X is Y", "X has Y", "X can Y"
    patterns = [
        r"([\w\s]+)\s+(?:is|are|was|were)\s+([^.!?]+)",
        r"([\w\s]+)\s+(?:has|have|had)\s+([^.!?]+)",
        r"([\w\s]+)\s+(?:can|could|will|would|should|must)\s+([^.!?]+)",
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, message, re.IGNORECASE)
        for match in matches:
            fact = f"{match[0].strip()} {match[1].strip()}"
            if len(fact) > 10 and len(fact) < 200:
                facts.append(fact)
    
    return facts[:3]  # Return top 3 facts


def get_openai_client():
    if OPENAI_API_KEY:
        return OpenAI(api_key=OPENAI_API_KEY)
    return None


def get_gemini_response(prompt: str, system_prompt: str, max_tokens: int = 500) -> Optional[str]:
    """Get response from Google Gemini API as fallback."""
    if not GEMINI_API_KEY:
        return None
    
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-pro")
        
        full_prompt = f"{system_prompt}\n\n{prompt}"
        response = model.generate_content(full_prompt, generation_config={"max_output_tokens": max_tokens})
        
        return response.text if response.text else None
    except Exception as e:
        print(f"[AGENT] Gemini API Error: {type(e).__name__}: {str(e)[:200]}", file=sys.stderr)
        return None


class MultiAgentSystem:
    def __init__(self, manual_agent_description: Optional[str] = None, conversation_history: Optional[list] = None, memories: Optional[List[str]] = None):
        self.manual_agent_description = manual_agent_description or "A helpful AI assistant"
        self.client = get_openai_client()
        self.conversation_history = conversation_history or []
        self.memories = memories or []
    
    def get_manual_response(self, user_message: str) -> str:
        system_prompt = f"""You are {self.manual_agent_description}. Respond naturally and professionally. Be direct, concise, and practical. Don't introduce yourself or explain what you're doing - just provide your response.
            
Memory from previous conversations:
{chr(10).join([f"- {m}" for m in self.memories]) if self.memories else "No prior context available"}"""
        
        # Try OpenAI first
        if self.client:
            try:
                messages = self.conversation_history.copy()
                messages.append({"role": "user", "content": user_message})
                messages.insert(0, {"role": "system", "content": system_prompt})
                
                response = self.client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=messages,
                    max_tokens=500,
                    temperature=0.7
                )
                return response.choices[0].message.content
            except Exception as e:
                print(f"[AGENT] OpenAI API Error: {type(e).__name__}: {str(e)[:200]}", file=sys.stderr)
        
        # Fallback to Gemini
        gemini_response = get_gemini_response(user_message, system_prompt, max_tokens=500)
        if gemini_response:
            print("[AGENT] Using Gemini as fallback", file=sys.stderr)
            return gemini_response
        
        # Last resort: simulate
        return self._simulate_manual_response(user_message)
    
    def get_critic_response(self, user_message: str, manual_response: str) -> str:
        system_prompt = """You are a thoughtful reviewer. Review responses critically but constructively. Provide brief feedback focused on practical improvements. Don't explain what you're doing - just give your feedback."""
        
        prompt = f"""Question: {user_message}

Response: {manual_response}

Feedback:"""
        
        # Try OpenAI first
        if self.client:
            try:
                response = self.client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=300,
                    temperature=0.7
                )
                return response.choices[0].message.content
            except Exception as e:
                print(f"[AGENT] OpenAI API Error (critic): {type(e).__name__}: {str(e)[:200]}", file=sys.stderr)
        
        # Fallback to Gemini
        gemini_response = get_gemini_response(prompt, system_prompt, max_tokens=300)
        if gemini_response:
            print("[AGENT] Using Gemini for critic (fallback)", file=sys.stderr)
            return gemini_response
        
        # Last resort: simulate
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


def process_multi_agent_chat(user_message: str, agent_description: Optional[str] = None, conversation_history: Optional[list] = None, memories: Optional[List[str]] = None) -> dict:
    system = MultiAgentSystem(agent_description, conversation_history, memories)
    
    manual_response = system.get_manual_response(user_message)
    
    critic_response = system.get_critic_response(user_message, manual_response)
    
    return {
        "user_message": user_message,
        "manual_agent_response": manual_response,
        "critic_agent_response": critic_response
    }
