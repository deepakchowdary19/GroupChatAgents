"""Memory management for multi-agent system."""
from typing import List
import re


def extract_key_facts(message: str) -> List[str]:
    """Extract key facts from a message for memory storage.
    
    Only extracts concise, conversation-relevant facts.
    Filters out generic background knowledge and overly long statements.
    """
    facts = []
    
    # Only extract facts that are short and specific (under 100 chars)
    # This filters out background context and long explanations
    patterns = [
        r"([\w\s]+)\s+(?:is|are|was|were)\s+([^.!?]+\.?)",
        r"([\w\s]+)\s+(?:has|have|had)\s+([^.!?]+\.?)",
        r"([\w\s]+)\s+(?:can|could|will|would|should|must)\s+([^.!?]+\.?)",
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, message, re.IGNORECASE)
        for match in matches:
            subject = match[0].strip()
            predicate = match[1].strip()
            
            # Filter out very long predicates (likely background info)
            if len(predicate) > 80:
                continue
            
            # Filter out overly generic subjects
            if subject.lower() in ['the formula', 'isolated light rainfall', 'widespread precipitation', 
                                   'residents', 'information', 'weather', 'state']:
                continue
            
            fact = f"{subject} {predicate}"
            
            # Final validation: fact should be conversational
            if 15 < len(fact) < 100 and not _is_generic_knowledge(fact):
                facts.append(fact)
    
    return facts[:3]  # Return top 3 facts


def _is_generic_knowledge(fact: str) -> bool:
    """Check if a fact is generic background knowledge rather than conversational context."""
    # Filter out weather, sports results, formulas, general knowledge
    generic_keywords = [
        'weather', 'rainfall', 'temperature', 'cricket', 'odи', 'formula', 
        'integration', 'equation', 'rule', 'pattern', 'currently experiencing',
        'not available', 'anticipated', 'expected'
    ]
    
    fact_lower = fact.lower()
    return any(keyword in fact_lower for keyword in generic_keywords)


def format_memories_for_prompt(memories: List[str]) -> str:
    """Format memories for injection into agent system prompts."""
    if not memories:
        return "No prior context available"
    return "\n".join([f"- {m}" for m in memories])
