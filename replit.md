# Multi-Agent Chat Application

## Overview
A multi-agent chat application built with FastAPI backend and React frontend, featuring a multi-agent system using Hugging Face's smolagents library.

## Architecture

### Backend (Python/FastAPI)
- **Framework**: FastAPI with uvicorn ASGI server
- **Database**: External PostgreSQL (Aiven)
- **AI Integration**: OpenAI API (gpt-3.5-turbo) with Google Gemini fallback
- **Port**: 8000
- **Key Dependencies**: openai, google-generativeai, sqlalchemy, pydantic

### Frontend (React/Vite)
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with Radix UI components
- **State Management**: Zustand + React Query
- **Port**: 5000 (proxies to backend on 8000)
- **Features**: Real-time agent chat, group management, agent creation

## Project Structure

```
├── backend/
│   ├── __init__.py
│   ├── agents.py         # Multi-agent system with smolagents
│   ├── config.py         # Configuration and environment variables
│   ├── database.py       # SQLAlchemy database setup
│   ├── models.py         # Database models
│   ├── routes.py         # FastAPI REST endpoints
│   └── schemas.py        # Pydantic schemas
├── client/
│   └── src/
│       ├── components/   # React components
│       ├── lib/          # Hooks, utilities, store
│       └── pages/        # Page components
├── shared/
│   └── schema.ts         # TypeScript type definitions
├── main.py               # FastAPI application entry point
├── vite.config.ts        # Vite configuration
└── package.json          # Node.js dependencies
```

## Multi-Agent System

### Agents
1. **Manual Agent (Assistant)**: A user-describable agent that responds to queries
2. **Critic Agent**: A fixed agent that analyzes and critiques the manual agent's responses

### Agent Flow
1. User sends a message to a group containing both agents
2. Manual Agent generates a response based on the user's message
3. Critic Agent analyzes the response and provides constructive feedback
4. Both responses are saved to the database and displayed in the UI

## API Endpoints

### Agents
- `GET /api/agents` - List all agents
- `POST /api/agents` - Create a new agent
- `PATCH /api/agents/{id}` - Update an agent
- `DELETE /api/agents/{id}` - Delete an agent

### Groups
- `GET /api/groups` - List all groups
- `POST /api/groups` - Create a new group
- `PATCH /api/groups/{id}` - Update a group
- `DELETE /api/groups/{id}` - Delete a group
- `POST /api/groups/{id}/agents/{agent_id}` - Add agent to group
- `DELETE /api/groups/{id}/agents/{agent_id}` - Remove agent from group

### Messages
- `GET /api/groups/{id}/messages` - Get messages for a group
- `POST /api/groups/{id}/messages` - Send a message (triggers multi-agent response)

### Initialization
- `POST /api/init-default-agents` - Create default agents and group

## Environment Variables

### Required
- `AIVEN_DATABASE_URL` - PostgreSQL connection string (Aiven)

### Optional
- `OPENAI_API_KEY` - Primary AI provider (gpt-3.5-turbo)
- `GEMINI_API_KEY` - Fallback AI provider (used if OpenAI quota exhausted)
- `HF_TOKEN` - Hugging Face token for advanced models

## Database Schema

### Tables
- `agents` - Agent definitions (name, role, type, system_prompt)
- `groups` - Chat groups
- `group_members` - Many-to-many relationship between groups and agents
- `messages` - Chat messages
- `conversations` - Full conversation records with agent responses
- `memories` - Stored facts/context extracted from conversations for semantic awareness

## Running the Application

### Development
1. Backend: `python main.py` (runs on port 8000)
2. Frontend: `npm run dev` (runs on port 5000, proxies /api to 8000)

### Workflows
- **Backend API**: Python FastAPI server
- **Frontend**: Vite development server

## Recent Changes (Session 4)
- **Gemini Fallback Integration**: Added Google Gemini as automatic fallback provider
  - Created `get_gemini_response()` function to handle Gemini API calls
  - Updated `get_manual_response()` to try OpenAI first, then Gemini if OpenAI fails
  - Updated `get_critic_response()` to try OpenAI first, then Gemini if OpenAI fails
  - Installed google-generativeai package for Gemini support
  - Added GEMINI_API_KEY to backend configuration
  - Graceful degradation: When both providers fail, falls back to simulated responses
  - Logs indicate which provider is being used for debugging

## Previous Changes (Session 3)
- **Memory System**: Implemented basic semantic memory for multi-agent system
  - Added `memories` table to store extracted key facts from conversations
  - Created `extract_key_facts()` function to extract important information from messages
  - Agents now retrieve and inject stored memories into system prompts for context awareness
  - Memories are automatically extracted and stored after each agent response
  - Pattern-based extraction: "X is Y", "X has Y", "X can Y" statements
  - Retrieves up to 5 most recent memories per group to maintain conversation context
- Updated MultiAgentSystem to accept and use memories in prompts
- Memory integration in chat API: retrieves memories when processing messages and stores extracted facts

## Features
- **Multi-Agent Chat**: Conversation with Assistant and Critic agents
- **Memory System**: Basic semantic memory with fact extraction and retrieval
- **Dual AI Provider**: OpenAI with automatic Gemini fallback for reliability
- **Real-time AI Responses**: Uses gpt-3.5-turbo (OpenAI) or gemini-pro (Gemini)
- **Typing Indicators**: Shows animated typing indicator while agents respond
- **Optimistic Updates**: User messages appear instantly for better UX
- **Agent Management**: Create, edit, and delete custom agents
- **Group Management**: Organize agents into chat groups
- **Database Persistence**: All conversations and memories stored in PostgreSQL
- **Auto-scroll**: Chat automatically scrolls to latest messages
- **Delete Group History**: Clear all messages and conversations for a group

## Memory System Details
- **Extraction**: Pattern-based extraction pulls key statements from user and AI messages
- **Storage**: Important facts stored in dedicated memories table per group
- **Retrieval**: Up to 5 most recent memories injected into agent system prompts
- **Context**: Agents see conversation history (last 10 messages) + stored memories
- **Future Enhancement**: Can be upgraded to semantic search with Hugging Face embeddings

## Known Limitations
- Memory extraction is pattern-based; future versions could use semantic search with embeddings
- WebSocket streaming not yet implemented (messages appear all at once when API returns)
- Full real-time streaming would require WebSocket implementation
