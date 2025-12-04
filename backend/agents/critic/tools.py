from langchain_tavily import TavilySearch
from langchain_core.tools import tool
import os
from backend.config import TAVILY_API_KEY

def get_critic_tools():
    """Returns the tools available for the critic agent."""
    if TAVILY_API_KEY:
        os.environ["TAVILY_API_KEY"] = TAVILY_API_KEY
    
    web_search = TavilySearch(
        max_results=5,
        topic="general",
        name="web_search",
        description="""Use this tool to search the web and verify facts, claims, or information.
        
WHEN TO USE:
- Verify any factual claims (dates, numbers, names, events)
- Check current information about news, sports, weather
- Confirm mathematical or scientific facts
- Validate historical information
- Cross-reference statistics or data mentioned

As a well-read critic, you MUST use this tool to verify claims before passing judgment.
A good critic never relies on assumptions - always search to confirm!

Input: A search query string describing what you want to verify.
Output: Search results with relevant information from the web."""
    )
    
    return [web_search]
