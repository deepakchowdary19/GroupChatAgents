"""Memory management for multi-agent system."""
from typing import List
import re


def extract_key_facts(message: str) -> List[str]:
    """Extract key facts from a message for memory storage.
    
    Extracts patterns like "X is Y", "X has Y", "X can Y" statements.
    """
    facts = []
    
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


def format_memories_for_prompt(memories: List[str]) -> str:
    """Format memories for injection into agent system prompts."""
    if not memories:
        return "No prior context available"
    return "\n".join([f"- {m}" for m in memories])
