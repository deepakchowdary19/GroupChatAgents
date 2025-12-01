from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db
from backend import models, schemas
from backend.agents import process_multi_agent_chat

router = APIRouter()


@router.get("/api/agents", response_model=List[schemas.AgentResponse])
def get_agents(db: Session = Depends(get_db)):
    agents = db.query(models.Agent).all()
    return agents


@router.get("/api/agents/{agent_id}", response_model=schemas.AgentResponse)
def get_agent(agent_id: str, db: Session = Depends(get_db)):
    agent = db.query(models.Agent).filter(models.Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.post("/api/agents", response_model=schemas.AgentResponse)
def create_agent(agent: schemas.AgentCreate, db: Session = Depends(get_db)):
    db_agent = models.Agent(**agent.model_dump())
    db.add(db_agent)
    db.commit()
    db.refresh(db_agent)
    return db_agent


@router.patch("/api/agents/{agent_id}", response_model=schemas.AgentResponse)
def update_agent(agent_id: str, updates: schemas.AgentUpdate, db: Session = Depends(get_db)):
    agent = db.query(models.Agent).filter(models.Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    update_data = updates.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(agent, key, value)
    
    db.commit()
    db.refresh(agent)
    return agent


@router.delete("/api/agents/{agent_id}")
def delete_agent(agent_id: str, db: Session = Depends(get_db)):
    agent = db.query(models.Agent).filter(models.Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    db.delete(agent)
    db.commit()
    return {"message": "Agent deleted"}


@router.get("/api/groups", response_model=List[schemas.GroupResponse])
def get_groups(db: Session = Depends(get_db)):
    groups = db.query(models.Group).all()
    result = []
    for group in groups:
        members = db.query(models.GroupMember).filter(
            models.GroupMember.group_id == group.id
        ).all()
        agent_ids = [m.agent_id for m in members]
        result.append({
            "id": group.id,
            "name": group.name,
            "description": group.description,
            "agentIds": agent_ids,
            "created_at": group.created_at
        })
    return result


@router.get("/api/groups/{group_id}", response_model=schemas.GroupResponse)
def get_group(group_id: str, db: Session = Depends(get_db)):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    members = db.query(models.GroupMember).filter(
        models.GroupMember.group_id == group_id
    ).all()
    agent_ids = [m.agent_id for m in members]
    
    return {
        "id": group.id,
        "name": group.name,
        "description": group.description,
        "agentIds": agent_ids,
        "created_at": group.created_at
    }


@router.post("/api/groups", response_model=schemas.GroupResponse)
def create_group(group_data: schemas.GroupCreate, db: Session = Depends(get_db)):
    db_group = models.Group(
        name=group_data.name,
        description=group_data.description
    )
    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    
    for agent_id in group_data.agentIds:
        member = models.GroupMember(group_id=db_group.id, agent_id=agent_id)
        db.add(member)
    db.commit()
    
    return {
        "id": db_group.id,
        "name": db_group.name,
        "description": db_group.description,
        "agentIds": group_data.agentIds,
        "created_at": db_group.created_at
    }


@router.patch("/api/groups/{group_id}", response_model=schemas.GroupResponse)
def update_group(group_id: str, updates: schemas.GroupUpdate, db: Session = Depends(get_db)):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    update_data = updates.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(group, key, value)
    
    db.commit()
    db.refresh(group)
    
    members = db.query(models.GroupMember).filter(
        models.GroupMember.group_id == group_id
    ).all()
    agent_ids = [m.agent_id for m in members]
    
    return {
        "id": group.id,
        "name": group.name,
        "description": group.description,
        "agentIds": agent_ids,
        "created_at": group.created_at
    }


@router.delete("/api/groups/{group_id}")
def delete_group(group_id: str, db: Session = Depends(get_db)):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    db.query(models.GroupMember).filter(
        models.GroupMember.group_id == group_id
    ).delete()
    db.delete(group)
    db.commit()
    return {"message": "Group deleted"}


@router.post("/api/groups/{group_id}/agents/{agent_id}")
def add_agent_to_group(group_id: str, agent_id: str, db: Session = Depends(get_db)):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    agent = db.query(models.Agent).filter(models.Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    existing = db.query(models.GroupMember).filter(
        models.GroupMember.group_id == group_id,
        models.GroupMember.agent_id == agent_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Agent already in group")
    
    member = models.GroupMember(group_id=group_id, agent_id=agent_id)
    db.add(member)
    db.commit()
    
    return {"message": "Agent added to group"}


@router.delete("/api/groups/{group_id}/agents/{agent_id}")
def remove_agent_from_group(group_id: str, agent_id: str, db: Session = Depends(get_db)):
    member = db.query(models.GroupMember).filter(
        models.GroupMember.group_id == group_id,
        models.GroupMember.agent_id == agent_id
    ).first()
    
    if not member:
        raise HTTPException(status_code=404, detail="Agent not in group")
    
    db.delete(member)
    db.commit()
    return {"message": "Agent removed from group"}


@router.get("/api/groups/{group_id}/messages", response_model=List[schemas.MessageResponse])
def get_messages(group_id: str, db: Session = Depends(get_db)):
    messages = db.query(models.Message).filter(
        models.Message.group_id == group_id
    ).order_by(models.Message.created_at).all()
    
    return [
        {
            "id": m.id,
            "groupId": m.group_id,
            "senderId": m.sender_id,
            "senderType": m.sender_type,
            "content": m.content,
            "createdAt": m.created_at
        }
        for m in messages
    ]


@router.post("/api/groups/{group_id}/messages", response_model=List[schemas.MessageResponse])
def send_message(group_id: str, message: schemas.MessageCreate, db: Session = Depends(get_db)):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    user_msg = models.Message(
        group_id=group_id,
        sender_id=message.senderId,
        sender_type=message.senderType,
        content=message.content
    )
    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)
    
    members = db.query(models.GroupMember).filter(
        models.GroupMember.group_id == group_id
    ).all()
    agent_ids = [m.agent_id for m in members]
    
    agents = db.query(models.Agent).filter(
        models.Agent.id.in_(agent_ids)
    ).all()
    
    manual_agent = None
    critic_agent = None
    for a in agents:
        if str(a.agent_type) == "manual":
            manual_agent = a
        elif str(a.agent_type) == "critic":
            critic_agent = a
    
    response_messages = []
    
    if manual_agent is not None or critic_agent is not None:
        agent_description = str(manual_agent.description) if manual_agent and manual_agent.description else "A helpful AI assistant"
        
        result = process_multi_agent_chat(message.content, agent_description)
        
        if manual_agent:
            manual_msg = models.Message(
                group_id=group_id,
                sender_id=manual_agent.id,
                sender_type="agent",
                content=result["manual_agent_response"]
            )
            db.add(manual_msg)
            db.commit()
            db.refresh(manual_msg)
            response_messages.append(manual_msg)
        
        if critic_agent:
            critic_msg = models.Message(
                group_id=group_id,
                sender_id=critic_agent.id,
                sender_type="agent",
                content=result["critic_agent_response"]
            )
            db.add(critic_msg)
            db.commit()
            db.refresh(critic_msg)
            response_messages.append(critic_msg)
        
        conversation = models.Conversation(
            group_id=group_id,
            user_message=message.content,
            manual_agent_response=result["manual_agent_response"],
            critic_agent_response=result["critic_agent_response"]
        )
        db.add(conversation)
        db.commit()
    
    all_messages = [user_msg] + response_messages
    
    return [
        {
            "id": m.id,
            "groupId": m.group_id,
            "senderId": m.sender_id,
            "senderType": m.sender_type,
            "content": m.content,
            "createdAt": m.created_at
        }
        for m in all_messages
    ]


@router.post("/api/chat", response_model=schemas.AgentChatResponse)
def chat_with_agents(request: schemas.AgentChatRequest):
    result = process_multi_agent_chat(request.message, request.agent_description)
    return result


@router.post("/api/init-default-agents")
def init_default_agents(db: Session = Depends(get_db)):
    existing_agents = db.query(models.Agent).filter(
        models.Agent.agent_type.in_(["manual", "critic"])
    ).all()
    
    if len(existing_agents) >= 2:
        return {"message": "Default agents already exist", "agents": [a.id for a in existing_agents]}
    
    manual_agent = models.Agent(
        name="Assistant",
        role="Primary AI Assistant",
        description="A helpful AI assistant that responds to user queries with detailed, thoughtful answers",
        color="#7C3AED",
        agent_type="manual",
        system_prompt="You are a helpful, knowledgeable AI assistant. Provide clear, accurate, and helpful responses."
    )
    
    critic_agent = models.Agent(
        name="Critic",
        role="Quality Reviewer",
        description="A constructive critic that analyzes responses and provides helpful feedback",
        color="#EC4899",
        agent_type="critic",
        system_prompt="You are a constructive critic. Analyze responses for accuracy, clarity, and completeness."
    )
    
    db.add(manual_agent)
    db.add(critic_agent)
    db.commit()
    
    db.refresh(manual_agent)
    db.refresh(critic_agent)
    
    default_group = models.Group(
        name="Multi-Agent Chat",
        description="Chat with the Assistant and Critic agents"
    )
    db.add(default_group)
    db.commit()
    db.refresh(default_group)
    
    db.add(models.GroupMember(group_id=default_group.id, agent_id=manual_agent.id))
    db.add(models.GroupMember(group_id=default_group.id, agent_id=critic_agent.id))
    db.commit()
    
    return {
        "message": "Default agents and group created",
        "manual_agent_id": manual_agent.id,
        "critic_agent_id": critic_agent.id,
        "group_id": default_group.id
    }
