export interface Agent {
  id: string;
  name: string;
  role: string;
  description: string | null;
  color: string;
  agent_type: string;
  system_prompt: string | null;
  created_at: string | null;
}

export interface InsertAgent {
  name: string;
  role: string;
  description?: string;
  color?: string;
  agent_type?: string;
  system_prompt?: string;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  created_at: string | null;
}

export interface InsertGroup {
  name: string;
  description?: string;
  agentIds?: string[];
}

export interface GroupMember {
  id: string;
  group_id: string;
  agent_id: string;
}

export interface Message {
  id: string;
  groupId: string;
  senderId: string | null;
  senderType: string;
  content: string;
  createdAt: string | null;
}

export interface InsertMessage {
  content: string;
  senderType: string;
  senderId?: string;
}
