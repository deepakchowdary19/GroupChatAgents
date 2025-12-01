import { 
  type User, type InsertUser, 
  type Agent, type InsertAgent,
  type Group, type InsertGroup,
  type GroupMember, type InsertGroupMember,
  type Message, type InsertMessage,
  users, agents, groups, groupMembers, messages 
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Agents
  getAgents(): Promise<Agent[]>;
  getAgent(id: string): Promise<Agent | undefined>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(id: string, updates: Partial<InsertAgent>): Promise<Agent | undefined>;
  deleteAgent(id: string): Promise<boolean>;
  
  // Groups
  getGroups(): Promise<Group[]>;
  getGroup(id: string): Promise<Group | undefined>;
  createGroup(group: InsertGroup): Promise<Group>;
  updateGroup(id: string, updates: Partial<InsertGroup>): Promise<Group | undefined>;
  deleteGroup(id: string): Promise<boolean>;
  
  // Group Members
  getGroupMembers(groupId: string): Promise<string[]>;
  addAgentToGroup(groupId: string, agentId: string): Promise<GroupMember>;
  removeAgentFromGroup(groupId: string, agentId: string): Promise<boolean>;
  
  // Messages
  getMessages(groupId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Agents
  async getAgents(): Promise<Agent[]> {
    return db.select().from(agents);
  }

  async getAgent(id: string): Promise<Agent | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.id, id));
    return agent;
  }

  async createAgent(agent: InsertAgent): Promise<Agent> {
    const [created] = await db.insert(agents).values(agent).returning();
    return created;
  }

  async updateAgent(id: string, updates: Partial<InsertAgent>): Promise<Agent | undefined> {
    const [updated] = await db
      .update(agents)
      .set(updates)
      .where(eq(agents.id, id))
      .returning();
    return updated;
  }

  async deleteAgent(id: string): Promise<boolean> {
    // Also remove from all groups
    await db.delete(groupMembers).where(eq(groupMembers.agentId, id));
    const result = await db.delete(agents).where(eq(agents.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Groups
  async getGroups(): Promise<Group[]> {
    return db.select().from(groups);
  }

  async getGroup(id: string): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.id, id));
    return group;
  }

  async createGroup(group: InsertGroup): Promise<Group> {
    const [created] = await db.insert(groups).values(group).returning();
    return created;
  }

  async updateGroup(id: string, updates: Partial<InsertGroup>): Promise<Group | undefined> {
    const [updated] = await db
      .update(groups)
      .set(updates)
      .where(eq(groups.id, id))
      .returning();
    return updated;
  }

  async deleteGroup(id: string): Promise<boolean> {
    // Also delete group members and messages
    await db.delete(groupMembers).where(eq(groupMembers.groupId, id));
    await db.delete(messages).where(eq(messages.groupId, id));
    const result = await db.delete(groups).where(eq(groups.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Group Members
  async getGroupMembers(groupId: string): Promise<string[]> {
    const members = await db
      .select({ agentId: groupMembers.agentId })
      .from(groupMembers)
      .where(eq(groupMembers.groupId, groupId));
    return members.map((m: { agentId: string }) => m.agentId);
  }

  async addAgentToGroup(groupId: string, agentId: string): Promise<GroupMember> {
    const [member] = await db
      .insert(groupMembers)
      .values({ groupId, agentId })
      .returning();
    return member;
  }

  async removeAgentFromGroup(groupId: string, agentId: string): Promise<boolean> {
    const result = await db
      .delete(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.agentId, agentId)
        )
      );
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Messages
  async getMessages(groupId: string): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(eq(messages.groupId, groupId))
      .orderBy(messages.createdAt);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [created] = await db.insert(messages).values(message).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
