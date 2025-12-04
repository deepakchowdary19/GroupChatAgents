from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class AgentCreate(BaseModel):
    name: str
    role: str
    description: Optional[str] = None
    color: str = "#7C3AED"
    agent_type: str = "manual"
    system_prompt: Optional[str] = None


class AgentUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    system_prompt: Optional[str] = None


class AgentResponse(BaseModel):
    id: str
    name: str
    role: str
    description: Optional[str]
    color: str
    agent_type: str
    system_prompt: Optional[str]
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class GroupCreate(BaseModel):
    name: str
    description: Optional[str] = None
    agentIds: List[str] = []


class GroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class GroupResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    agentIds: List[str] = []
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class MessageCreate(BaseModel):
    content: str
    senderType: str
    senderId: Optional[str] = None
    memory_type: Optional[str] = "long"


class MessageResponse(BaseModel):
    id: str
    groupId: str
    senderId: Optional[str]
    senderType: str
    content: str
    createdAt: Optional[datetime]

    class Config:
        from_attributes = True


class AgentChatRequest(BaseModel):
    message: str
    agent_description: Optional[str] = None
    memory_type: Optional[str] = "long"
    group_id: Optional[str] = None


class AgentChatResponse(BaseModel):
    user_message: str
    manual_agent_response: str
    critic_agent_response: str
