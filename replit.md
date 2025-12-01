# Multi-Agent Chat Application

## Overview
A multi-agent chat application built with FastAPI backend and React frontend, featuring a multi-agent system using Hugging Face's smolagents library.

## Architecture

### Backend (Python/FastAPI)
- **Framework**: FastAPI with uvicorn ASGI server
- **Database**: External PostgreSQL (Aiven)
- **Multi-Agent System**: smolagents from Hugging Face
- **Port**: 8000

### Frontend (React/Vite)
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with Radix UI components
- **State Management**: Zustand + React Query
- **Port**: 5000 (proxies to backend on 8000)

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
- `OPENAI_API_KEY` - For actual AI responses (without this, simulated responses are used)
- `HF_TOKEN` - Hugging Face token for advanced models

## Database Schema

### Tables
- `agents` - Agent definitions (name, role, type, system_prompt)
- `groups` - Chat groups
- `group_members` - Many-to-many relationship between groups and agents
- `messages` - Chat messages
- `conversations` - Full conversation records with agent responses

## Running the Application

### Development
1. Backend: `python main.py` (runs on port 8000)
2. Frontend: `npm run dev` (runs on port 5000, proxies /api to 8000)

### Workflows
- **Backend API**: Python FastAPI server
- **Frontend**: Vite development server

## Recent Changes
- Converted from Express.js to FastAPI backend
- Integrated smolagents for multi-agent system
- Connected to external Aiven PostgreSQL database
- Added default Manual Agent and Critic Agent
