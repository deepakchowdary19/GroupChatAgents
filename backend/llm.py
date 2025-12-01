"""LLM orchestration layer - handles OpenAI and Gemini with fallback."""
from openai import OpenAI
from typing import Optional, List
import sys
from backend.config import OPENAI_API_KEY, GEMINI_API_KEY


class LLMOrchestrator:
    """Orchestrates calls to OpenAI with Gemini fallback."""
    
    def __init__(self):
        self.openai_client = self._get_openai_client()
    
    @staticmethod
    def _get_openai_client() -> Optional[OpenAI]:
        """Initialize OpenAI client if API key is available."""
        if OPENAI_API_KEY:
            return OpenAI(api_key=OPENAI_API_KEY)
        return None
    
    def get_response(self, messages: List[dict], model: str = "gpt-3.5-turbo", 
                    max_tokens: int = 500, temperature: float = 0.7) -> Optional[str]:
        """Get response from LLM with automatic fallback.
        
        Tries OpenAI first, then Gemini, then returns None.
        """
        # Try OpenAI first
        if self.openai_client:
            try:
                response = self.openai_client.chat.completions.create(
                    model=model,
                    messages=messages,
                    max_tokens=max_tokens,
                    temperature=temperature
                )
                return response.choices[0].message.content
            except Exception as e:
                print(f"[LLM] OpenAI Error: {type(e).__name__}: {str(e)[:200]}", file=sys.stderr)
        
        # Fallback to Gemini
        gemini_response = self._get_gemini_response(messages, max_tokens)
        if gemini_response:
            print("[LLM] Using Gemini as fallback", file=sys.stderr)
            return gemini_response
        
        return None
    
    @staticmethod
    def _get_gemini_response(messages: List[dict], max_tokens: int = 500) -> Optional[str]:
        """Get response from Google Gemini API as fallback."""
        if not GEMINI_API_KEY:
            return None
        
        try:
            import google.generativeai as genai
            genai.configure(api_key=GEMINI_API_KEY)
            model = genai.GenerativeModel("gemini-2.5-flash")
            
            # Convert messages format for Gemini
            prompt = ""
            for msg in messages:
                if msg["role"] == "system":
                    prompt += f"{msg['content']}\n\n"
                elif msg["role"] == "user":
                    prompt += f"{msg['content']}\n"
            
            response = model.generate_content(
                prompt, 
                generation_config={"max_output_tokens": max_tokens}
            )
            
            # Check if response has valid content
            if response and hasattr(response, 'candidates') and response.candidates:
                try:
                    text = response.text
                    if text:
                        return text
                except ValueError:
                    print("[LLM] Gemini blocked/empty response", file=sys.stderr)
                    return None
            return None
        except Exception as e:
            print(f"[LLM] Gemini Error: {type(e).__name__}: {str(e)[:200]}", file=sys.stderr)
            return None
