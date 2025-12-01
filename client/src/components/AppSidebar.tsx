import { useState } from 'react';
import { useUIStore } from '@/lib/store';
import { 
  useAgents, 
  useGroups, 
  useCreateAgent, 
  useUpdateAgent, 
  useDeleteAgent,
  useCreateGroup,
  useDeleteGroup,
  useAddAgentToGroup,
  type GroupWithAgents
} from '@/lib/hooks';
import { GroupItem } from './GroupItem';
import { AgentCard } from './AgentCard';
import { CreateAgentDialog } from './CreateAgentDialog';
import { CreateGroupDialog } from './CreateGroupDialog';
import { AddAgentToGroupDialog } from './AddAgentToGroupDialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Users, Bot, Loader2 } from 'lucide-react';
import type { Agent } from '@shared/schema';

export function AppSidebar() {
  const { selectedGroupId, selectGroup, setSelectedAgentId } = useUIStore();
  
  const { data: agents = [], isLoading: agentsLoading } = useAgents();
  const { data: groups = [], isLoading: groupsLoading } = useGroups();
  
  const createAgentMutation = useCreateAgent();
  const updateAgentMutation = useUpdateAgent();
  const deleteAgentMutation = useDeleteAgent();
  const createGroupMutation = useCreateGroup();
  const deleteGroupMutation = useDeleteGroup();
  const addAgentToGroupMutation = useAddAgentToGroup();

  const [createAgentOpen, setCreateAgentOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [addAgentToGroupOpen, setAddAgentToGroupOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [selectedGroupForAddAgent, setSelectedGroupForAddAgent] = useState<string | null>(null);

  const handleCreateAgent = (data: { name: string; role: string; description?: string; color: string }) => {
    createAgentMutation.mutate({ ...data, description: data.description ?? undefined });
    setCreateAgentOpen(false);
  };

  const handleEditAgent = (data: { name: string; role: string; description?: string; color: string }) => {
    if (editingAgent) {
      updateAgentMutation.mutate({ id: editingAgent.id, updates: { ...data, description: data.description ?? undefined } });
      setEditingAgent(null);
    }
  };

  const handleCreateGroup = (data: { name: string; description?: string }, agentIds: string[]) => {
    createGroupMutation.mutate(
      { group: { ...data, description: data.description ?? undefined }, agentIds },
      {
        onSuccess: (newGroup) => {
          selectGroup(newGroup.id);
          setCreateGroupOpen(false);
        }
      }
    );
  };

  const handleAddAgentsToGroup = (agentIds: string[]) => {
    if (selectedGroupForAddAgent) {
      agentIds.forEach((agentId) => {
        addAgentToGroupMutation.mutate({ groupId: selectedGroupForAddAgent, agentId });
      });
      setAddAgentToGroupOpen(false);
    }
  };

  const openAddAgentDialog = (groupId: string) => {
    setSelectedGroupForAddAgent(groupId);
    setAddAgentToGroupOpen(true);
  };

  const handleDeleteGroup = (groupId: string) => {
    deleteGroupMutation.mutate(groupId);
    if (selectedGroupId === groupId) {
      selectGroup(null);
    }
  };

  const isLoading = agentsLoading || groupsLoading;
  const selectedGroupAgentIds = groups.find((g) => g.id === selectedGroupForAddAgent)?.agentIds || [];

  return (
    <div className="w-72 h-full flex flex-col bg-sidebar border-r" data-testid="sidebar-main">
      <div className="p-4 border-b">
        <h1 className="text-lg font-semibold flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          AI Agents Chat
        </h1>
      </div>

      <Tabs defaultValue="groups" className="flex-1 flex flex-col">
        <div className="px-2 pt-2">
          <TabsList className="w-full">
            <TabsTrigger value="groups" className="flex-1" data-testid="tab-groups">
              <Users className="h-4 w-4 mr-1.5" />
              Groups
            </TabsTrigger>
            <TabsTrigger value="agents" className="flex-1" data-testid="tab-agents">
              <Bot className="h-4 w-4 mr-1.5" />
              Agents
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="groups" className="flex-1 flex flex-col mt-0 data-[state=inactive]:hidden">
          <div className="p-2">
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              onClick={() => setCreateGroupOpen(true)}
              disabled={createGroupMutation.isPending}
              data-testid="button-create-group"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Group
            </Button>
          </div>
          <Separator />
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : groups.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No groups yet. Create one to get started!
                </p>
              ) : (
                groups.map((group: GroupWithAgents) => {
                  const groupAgentsList = group.agentIds
                    .map((id) => agents.find((a) => a.id === id))
                    .filter((a): a is Agent => a !== undefined);

                  return (
                    <GroupItem
                      key={group.id}
                      group={group}
                      agents={groupAgentsList}
                      isSelected={selectedGroupId === group.id}
                      onSelect={() => selectGroup(group.id)}
                      onDelete={() => handleDeleteGroup(group.id)}
                      onAddAgent={() => openAddAgentDialog(group.id)}
                      onAgentClick={(agentId) => setSelectedAgentId(agentId)}
                    />
                  );
                })
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="agents" className="flex-1 flex flex-col mt-0 data-[state=inactive]:hidden">
          <div className="p-2">
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              onClick={() => setCreateAgentOpen(true)}
              disabled={createAgentMutation.isPending}
              data-testid="button-create-agent"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Agent
            </Button>
          </div>
          <Separator />
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {agentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : agents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No agents yet. Create one to get started!
                </p>
              ) : (
                agents.map((agent) => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    onClick={() => setSelectedAgentId(agent.id)}
                    onEdit={() => setEditingAgent(agent)}
                    onDelete={() => deleteAgentMutation.mutate(agent.id)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <CreateAgentDialog
        open={createAgentOpen}
        onOpenChange={setCreateAgentOpen}
        onSubmit={handleCreateAgent}
      />

      <CreateAgentDialog
        open={editingAgent !== null}
        onOpenChange={(open) => !open && setEditingAgent(null)}
        onSubmit={handleEditAgent}
        initialValues={editingAgent ? { 
          name: editingAgent.name, 
          role: editingAgent.role, 
          description: editingAgent.description ?? undefined, 
          color: editingAgent.color 
        } : undefined}
        mode="edit"
      />

      <CreateGroupDialog
        open={createGroupOpen}
        onOpenChange={setCreateGroupOpen}
        onSubmit={handleCreateGroup}
        agents={agents}
      />

      <AddAgentToGroupDialog
        open={addAgentToGroupOpen}
        onOpenChange={setAddAgentToGroupOpen}
        onSubmit={handleAddAgentsToGroup}
        availableAgents={agents}
        currentAgentIds={selectedGroupAgentIds}
      />
    </div>
  );
}
