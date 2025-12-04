from langchain_tavily import TavilySearch
import os
from backend.config import TAVILY_API_KEY

def get_critic_tools():
    """Returns the tools available for the critic agent."""
    # Set API key as environment variable for Tavily
    if TAVILY_API_KEY:
        os.environ["TAVILY_API_KEY"] = TAVILY_API_KEY
    
    browserTool = TavilySearch(
        max_results=5,
        topic="general",
    )
    return [browserTool]
