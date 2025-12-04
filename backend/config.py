import os
from dotenv import load_dotenv

# Load from .env file if it exists (for local development)
load_dotenv(override=False)

AIVEN_DATABASE_URL = os.getenv("AIVEN_DATABASE_URL", "")

if not AIVEN_DATABASE_URL:
    raise ValueError("AIVEN_DATABASE_URL environment variable is required")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY", "")
HF_TOKEN = os.getenv("HF_TOKEN", "")
CHROMA_API_KEY = os.getenv("CHROMA_API_KEY", "")
CHROMA_TENANT = os.getenv("CHROMA_TENANT", "")
CHROMA_DATABASE = os.getenv("CHROMA_DATABASE", "")
