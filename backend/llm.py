from langchain_google_genai import ChatGoogleGenerativeAI
from backend.config import GEMINI_API_KEY
import os

def get_llm(model_name: str = "gemini-2.0-flash", temperature: float = 0.7):
    """Get a LangChain LLM instance."""
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is required")
    
    return ChatGoogleGenerativeAI(
        model=model_name,
        temperature=temperature,
        google_api_key=GEMINI_API_KEY
    )
