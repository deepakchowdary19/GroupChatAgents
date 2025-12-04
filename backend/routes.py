from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db
from backend import models, schemas
from backend.orchestrator import process_multi_agent_chat, stream_multi_agent_chat
from fastapi.responses import StreamingResponse

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


@router.delete("/api/groups/{group_id}/messages")
def delete_group_messages(group_id: str, db: Session = Depends(get_db)):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    db.query(models.Message).filter(models.Message.group_id == group_id).delete()
    db.query(models.Conversation).filter(models.Conversation.group_id == group_id).delete()
    db.commit()
    return {"message": "Chat history deleted"}


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
    
    # If this is an agent message (not from user), just save it and return
    if message.senderType == "agent":
        return [
            {
                "id": user_msg.id,
                "groupId": user_msg.group_id,
                "senderId": user_msg.sender_id,
                "senderType": user_msg.sender_type,
                "content": user_msg.content,
                "createdAt": user_msg.created_at
            }
        ]
    
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
        # Extract agent description safely
        if manual_agent is not None:
            desc = manual_agent.description
            agent_description = str(desc) if desc is not None else "A helpful AI assistant"
        else:
            agent_description = "A helpful AI assistant"
        
        # Process with critic agent - memory retrieval happens in orchestrator via vector search
        result = process_multi_agent_chat(
            user_message=message.content,
            agent_id=group_id,
            agent_description=agent_description,
            conversation_history=None,  # Not needed - orchestrator uses vector memory
            store_memory=True
        )
        
        # Get the final response (could be from all_responses or manual_agent_response)
        final_response = result.get("manual_agent_response", "")
        all_responses = result.get("all_responses", [])
        
        # Use the last response from all_responses if available, otherwise use manual_agent_response
        if all_responses:
            final_response = all_responses[-1]
        
        if manual_agent and final_response:
            manual_msg = models.Message(
                group_id=group_id,
                sender_id=manual_agent.id,
                sender_type="agent",
                content=final_response
            )
            db.add(manual_msg)
            db.commit()
            db.refresh(manual_msg)
            response_messages.append(manual_msg)
        
        if critic_agent:
            # Ensure critic response is stored as text; serialize if dict
            critic_content = result["critic_agent_response"]
            if isinstance(critic_content, dict):
                import json
                critic_content = json.dumps(critic_content, ensure_ascii=False)
            critic_msg = models.Message(
                group_id=group_id,
                sender_id=critic_agent.id,
                sender_type="agent",
                content=critic_content
            )
            db.add(critic_msg)
            db.commit()
            db.refresh(critic_msg)
            response_messages.append(critic_msg)
        
        # Serialize critic response in conversation if it's a dict
        import json
        critic_conv = result.get("critic_agent_response", "")
        if isinstance(critic_conv, dict):
            critic_conv = json.dumps(critic_conv, ensure_ascii=False)
        conversation = models.Conversation(
            group_id=group_id,
            user_message=message.content,
            manual_agent_response=final_response,
            critic_agent_response=critic_conv
        )
        db.add(conversation)
        db.commit()
        
        # Store basic facts as memories (simplified - no LLM extraction for now)
        facts_to_store = [
            f"User asked: {message.content[:100]}",
            f"Response: {final_response[:100]}" if final_response else ""
        ]
        for fact in [f for f in facts_to_store if f]:
            memory = models.Memory(
                group_id=group_id,
                content=fact,
                importance="normal"
            )
            db.add(memory)
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
    # Use a default agent_id if not provided
    agent_id = "default_agent"
    result = process_multi_agent_chat(
        user_message=request.message,
        agent_id=agent_id,
        agent_description=request.agent_description,
        store_memory=True
    )
    return result


@router.post("/api/chat/stream")
async def chat_with_agents_stream(request: schemas.AgentChatRequest, db: Session = Depends(get_db)):
    # Use a default agent_id if not provided
    agent_id = request.group_id or "default_agent"
    
    # Collect the streamed content
    responder_content = ""
    critic_content = None
    
    async def generate_and_save():
        nonlocal responder_content, critic_content
        
        async for chunk in stream_multi_agent_chat(
            user_message=request.message,
            agent_id=agent_id,
            agent_description=request.agent_description,
            store_memory=True,
            memory_type=request.memory_type or "long"
        ):
            # Parse the chunk to track content
            try:
                import json
                data = json.loads(chunk.strip())
                if data.get("type") == "responder":
                    responder_content = data.get("content", "")
                elif data.get("type") == "critic":
                    critic_content = data.get("content")
            except:
                pass
            yield chunk
        
        # After streaming completes, save messages to database if group_id provided
        if request.group_id:
            try:
                # Get group and agents
                group = db.query(models.Group).filter(models.Group.id == request.group_id).first()
                if group:
                    members = db.query(models.GroupMember).filter(
                        models.GroupMember.group_id == request.group_id
                    ).all()
                    agent_ids = [m.agent_id for m in members]
                    agents = db.query(models.Agent).filter(models.Agent.id.in_(agent_ids)).all()
                    
                    assistant_agent = None
                    critic_agent = None
                    for a in agents:
                        if str(a.agent_type) == "manual":
                            assistant_agent = a
                        elif str(a.agent_type) == "critic":
                            critic_agent = a
                    
                    # Save user message
                    user_msg = models.Message(
                        group_id=request.group_id,
                        sender_id=None,
                        sender_type="user",
                        content=request.message
                    )
                    db.add(user_msg)
                    db.commit()
                    
                    # Save assistant response
                    if assistant_agent and responder_content:
                        assistant_msg = models.Message(
                            group_id=request.group_id,
                            sender_id=assistant_agent.id,
                            sender_type="agent",
                            content=responder_content
                        )
                        db.add(assistant_msg)
                        db.commit()
                    
                    # Save critic response as separate message
                    if critic_agent and critic_content:
                        # Format critic response nicely
                        if isinstance(critic_content, dict):
                            verdict = critic_content.get('verdict', 'N/A')
                            feedback = critic_content.get('feedback', 'No feedback provided')
                            critic_text = f"**Verdict:** {verdict}\n\n**Feedback:** {feedback}"
                        else:
                            critic_text = str(critic_content)
                        
                        critic_msg = models.Message(
                            group_id=request.group_id,
                            sender_id=critic_agent.id,
                            sender_type="agent",
                            content=critic_text
                        )
                        db.add(critic_msg)
                        db.commit()
            except Exception as e:
                print(f"Error saving messages: {e}")
    
    return StreamingResponse(
        generate_and_save(),
        media_type="text/event-stream"
    )


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
