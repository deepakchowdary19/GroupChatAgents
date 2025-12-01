import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from './queryClient';
import type { Agent, Group, Message, InsertAgent, InsertGroup } from '@shared/schema';

export interface GroupWithAgents extends Group {
  agentIds: string[];
}

export function useAgents() {
  return useQuery<Agent[]>({
    queryKey: ['/api/agents'],
  });
}

export function useAgent(id: string | null) {
  return useQuery<Agent>({
    queryKey: ['/api/agents', id],
    enabled: !!id,
  });
}

export function useCreateAgent() {
  return useMutation({
    mutationFn: async (agent: Omit<InsertAgent, 'id'>) => {
      const res = await apiRequest('POST', '/api/agents', agent);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
    },
  });
}

export function useUpdateAgent() {
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<InsertAgent> }) => {
      const res = await apiRequest('PATCH', `/api/agents/${id}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
    },
  });
}

export function useDeleteAgent() {
  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/agents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
    },
  });
}

export function useGroups() {
  return useQuery<GroupWithAgents[]>({
    queryKey: ['/api/groups'],
  });
}

export function useGroup(id: string | null) {
  return useQuery<GroupWithAgents>({
    queryKey: ['/api/groups', id],
    enabled: !!id,
  });
}

export function useCreateGroup() {
  return useMutation({
    mutationFn: async ({ group, agentIds }: { group: Omit<InsertGroup, 'id'>; agentIds: string[] }) => {
      const res = await apiRequest('POST', '/api/groups', { ...group, agentIds });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
    },
  });
}

export function useUpdateGroup() {
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<InsertGroup> }) => {
      const res = await apiRequest('PATCH', `/api/groups/${id}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
    },
  });
}

export function useDeleteGroup() {
  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/groups/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
    },
  });
}

export function useAddAgentToGroup() {
  return useMutation({
    mutationFn: async ({ groupId, agentId }: { groupId: string; agentId: string }) => {
      const res = await apiRequest('POST', `/api/groups/${groupId}/agents/${agentId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
    },
  });
}

export function useRemoveAgentFromGroup() {
  return useMutation({
    mutationFn: async ({ groupId, agentId }: { groupId: string; agentId: string }) => {
      await apiRequest('DELETE', `/api/groups/${groupId}/agents/${agentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
    },
  });
}

export function useMessages(groupId: string | null) {
  return useQuery<Message[]>({
    queryKey: ['/api/groups', groupId, 'messages'],
    enabled: !!groupId,
  });
}

export function useSendMessage() {
  return useMutation({
    mutationFn: async ({ groupId, content }: { groupId: string; content: string }) => {
      const res = await apiRequest('POST', `/api/groups/${groupId}/messages`, {
        content,
        senderType: 'user',
        senderId: null,
      });
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/groups', variables.groupId, 'messages'] });
    },
  });
}
