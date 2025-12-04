"""Critic Agent implementation using LangChain and Google Generative AI."""
from typing import Dict, Any, Optional
import json
from langchain_google_genai import ChatGoogleGenerativeAI
from backend.config import GEMINI_API_KEY
from .prompts import CRITIC_SYSTEM_PROMPT
from .tools import get_critic_tools
from langchain.agents import create_agent


class CriticAgent:
    """Critic Agent that evaluates responses using LangChain and Google Gemini."""
    
    def __init__(self, model_name: str = "gemini-2.0-flash", temperature: float = 0.3):
        """Initialize the Critic Agent.
        
        Args:
            model_name: Google Gemini model to use
            temperature: Temperature for generation (lower = more deterministic)
        """
        if not GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is required for CriticAgent")
        
        # Initialize the LLM
        self.llm = ChatGoogleGenerativeAI(
            model=model_name,
            temperature=temperature,
            google_api_key=GEMINI_API_KEY
        )
        
        # Get tools
        self.tools = get_critic_tools()
        
        # Create the agent using the modern create_agent API
        self.agent = create_agent(
            model=self.llm,
            tools=self.tools,
            system_prompt=CRITIC_SYSTEM_PROMPT
        )
    
    def evaluate(self, question: str, answer: str, context: Optional[str] = None) -> Dict[str, Any]:
        """Evaluate an answer using the critic agent.
        
        Args:
            question: The original question that was asked
            answer: The answer to evaluate
            context: Optional additional context (can include memory/conversation history)
            
        Returns:
            Dictionary with verdict, feedback, evidence, and sources
        """
        # Construct the evaluation message
        user_message = f"""
Question: {question}

Answer to Evaluate:
{answer}
"""
        if context:
            user_message += f"\nAdditional Context:\n{context}"
        
        user_message += "\n\nPlease evaluate this answer and provide your critique in JSON format with keys: verdict, feedback, evidence, sources."
        
        try:
            # Invoke the agent with messages
            result = self.agent.invoke({
                "messages": [{"role": "user", "content": user_message}]
            })
            
            # Extract the final message content
            messages = result.get("messages", [])
            if messages:
                last_message = messages[-1]
                output = last_message.content if hasattr(last_message, 'content') else str(last_message)
            else:
                output = "{}"
            
            # Try to extract JSON from the output
            critique = self._parse_json_output(output)
            
            return critique
            
        except Exception as e:
            return {
                "verdict": "error",
                "feedback": f"Error during evaluation: {str(e)}",
                "evidence": [],
                "sources": []
            }
    
    def _parse_json_output(self, output: str) -> Dict[str, Any]:
        """Parse JSON output from the agent response.
        
        Args:
            output: The agent's output string
            
        Returns:
            Parsed dictionary or default structure
        """
        # Try to find JSON in the output
        try:
            # First try direct parsing
            return json.loads(output)
        except json.JSONDecodeError:
            # Try to extract JSON from markdown code blocks
            import re
            json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', output, re.DOTALL)
            if json_match:
                try:
                    return json.loads(json_match.group(1))
                except json.JSONDecodeError:
                    pass
            
            # Try to find any JSON object in the text
            json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', output, re.DOTALL)
            if json_match:
                try:
                    return json.loads(json_match.group(0))
                except json.JSONDecodeError:
                    pass
        
        # Return the output as feedback if we can't parse it
        return {
            "verdict": "needs_revision",
            "feedback": output,
            "evidence": [],
            "sources": []
        }


def create_critic_agent(model_name: str = "gemini-2.0-flash", temperature: float = 0.3) -> CriticAgent:
    """Factory function to create a CriticAgent instance.
    
    Args:
        model_name: Google Gemini model to use
        temperature: Temperature for generation
        
    Returns:
        Initialized CriticAgent instance
    """
    return CriticAgent(model_name=model_name, temperature=temperature)


def evaluate_answer(question: str, answer: str, context: Optional[str] = None) -> Dict[str, Any]:
    """Convenience function to evaluate an answer using the critic agent.
    
    Args:
        question: The original question that was asked
        answer: The answer to evaluate
        context: Optional additional context
        
    Returns:
        Dictionary with verdict, feedback, evidence, and sources
    """
    agent = create_critic_agent()
    return agent.evaluate(question=question, answer=answer, context=context)
