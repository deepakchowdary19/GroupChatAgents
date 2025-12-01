import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAgentSchema, insertGroupSchema, insertMessageSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // === AGENTS ===
  
  // Get all agents
  app.get("/api/agents", async (req, res) => {
    try {
      const agents = await storage.getAgents();
      res.json(agents);
    } catch (error) {
      console.error("Error fetching agents:", error);
      res.status(500).json({ error: "Failed to fetch agents" });
    }
  });

  // Get single agent
  app.get("/api/agents/:id", async (req, res) => {
    try {
      const agent = await storage.getAgent(req.params.id);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      res.json(agent);
    } catch (error) {
      console.error("Error fetching agent:", error);
      res.status(500).json({ error: "Failed to fetch agent" });
    }
  });

  // Create agent
  app.post("/api/agents", async (req, res) => {
    try {
      const parsed = insertAgentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid agent data", details: parsed.error.errors });
      }
      const agent = await storage.createAgent(parsed.data);
      res.status(201).json(agent);
    } catch (error) {
      console.error("Error creating agent:", error);
      res.status(500).json({ error: "Failed to create agent" });
    }
  });

  // Update agent
  app.patch("/api/agents/:id", async (req, res) => {
    try {
      const agent = await storage.updateAgent(req.params.id, req.body);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      res.json(agent);
    } catch (error) {
      console.error("Error updating agent:", error);
      res.status(500).json({ error: "Failed to update agent" });
    }
  });

  // Delete agent
  app.delete("/api/agents/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteAgent(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Agent not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting agent:", error);
      res.status(500).json({ error: "Failed to delete agent" });
    }
  });

  // === GROUPS ===

  // Get all groups with their agent members
  app.get("/api/groups", async (req, res) => {
    try {
      const groupsList = await storage.getGroups();
      const groupsWithMembers = await Promise.all(
        groupsList.map(async (group) => {
          const agentIds = await storage.getGroupMembers(group.id);
          return { ...group, agentIds };
        })
      );
      res.json(groupsWithMembers);
    } catch (error) {
      console.error("Error fetching groups:", error);
      res.status(500).json({ error: "Failed to fetch groups" });
    }
  });

  // Get single group with members
  app.get("/api/groups/:id", async (req, res) => {
    try {
      const group = await storage.getGroup(req.params.id);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      const agentIds = await storage.getGroupMembers(group.id);
      res.json({ ...group, agentIds });
    } catch (error) {
      console.error("Error fetching group:", error);
      res.status(500).json({ error: "Failed to fetch group" });
    }
  });

  // Create group with optional agent members
  app.post("/api/groups", async (req, res) => {
    try {
      const { agentIds = [], ...groupData } = req.body;
      const parsed = insertGroupSchema.safeParse(groupData);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid group data", details: parsed.error.errors });
      }
      const group = await storage.createGroup(parsed.data);
      
      // Add agents to group
      for (const agentId of agentIds) {
        await storage.addAgentToGroup(group.id, agentId);
      }
      
      res.status(201).json({ ...group, agentIds });
    } catch (error) {
      console.error("Error creating group:", error);
      res.status(500).json({ error: "Failed to create group" });
    }
  });

  // Update group
  app.patch("/api/groups/:id", async (req, res) => {
    try {
      const { agentIds, ...updates } = req.body;
      const group = await storage.updateGroup(req.params.id, updates);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      const currentAgentIds = await storage.getGroupMembers(group.id);
      res.json({ ...group, agentIds: currentAgentIds });
    } catch (error) {
      console.error("Error updating group:", error);
      res.status(500).json({ error: "Failed to update group" });
    }
  });

  // Delete group
  app.delete("/api/groups/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteGroup(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Group not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting group:", error);
      res.status(500).json({ error: "Failed to delete group" });
    }
  });

  // === GROUP MEMBERS ===

  // Add agent to group
  app.post("/api/groups/:groupId/agents/:agentId", async (req, res) => {
    try {
      const { groupId, agentId } = req.params;
      const member = await storage.addAgentToGroup(groupId, agentId);
      res.status(201).json(member);
    } catch (error) {
      console.error("Error adding agent to group:", error);
      res.status(500).json({ error: "Failed to add agent to group" });
    }
  });

  // Remove agent from group
  app.delete("/api/groups/:groupId/agents/:agentId", async (req, res) => {
    try {
      const { groupId, agentId } = req.params;
      const removed = await storage.removeAgentFromGroup(groupId, agentId);
      if (!removed) {
        return res.status(404).json({ error: "Agent not in group" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error removing agent from group:", error);
      res.status(500).json({ error: "Failed to remove agent from group" });
    }
  });

  // === MESSAGES ===

  // Get messages for a group
  app.get("/api/groups/:groupId/messages", async (req, res) => {
    try {
      const msgs = await storage.getMessages(req.params.groupId);
      res.json(msgs);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Send a message to a group
  app.post("/api/groups/:groupId/messages", async (req, res) => {
    try {
      const { groupId } = req.params;
      const messageData = {
        ...req.body,
        groupId,
        senderType: req.body.senderType || "user",
        senderId: req.body.senderId || null,
      };
      
      const parsed = insertMessageSchema.safeParse(messageData);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid message data", details: parsed.error.errors });
      }
      
      const message = await storage.createMessage(parsed.data);
      
      // Simulate agent responses if it's a user message
      if (message.senderType === "user") {
        const agentIds = await storage.getGroupMembers(groupId);
        const agents = await Promise.all(
          agentIds.map((id) => storage.getAgent(id))
        );
        
        // Create simulated responses from each agent
        const responses = await Promise.all(
          agents
            .filter((a) => a !== undefined)
            .map(async (agent, index) => {
              const responseData = {
                groupId,
                senderId: agent!.id,
                senderType: "agent" as const,
                content: `[${agent!.name}]: I received your message and I'm processing it as a ${agent!.role}.`,
              };
              // Add a slight delay effect by returning in order
              return storage.createMessage(responseData);
            })
        );
        
        res.status(201).json({ userMessage: message, agentResponses: responses });
      } else {
        res.status(201).json(message);
      }
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ error: "Failed to create message" });
    }
  });

  return httpServer;
}
