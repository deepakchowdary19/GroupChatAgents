import { useUIStore } from '@/lib/store';
import { 
  useAgents, 
  useGroups, 
  useUpdateAgent, 
  useDeleteAgent, 
  useRemoveAgentFromGroup,
  type GroupWithAgents
} from '@/lib/hooks';
import { AgentDetailPanel } from './AgentDetailPanel';
import { CreateAgentDialog } from './CreateAgentDialog';
import { useState } from 'react';
import type { Agent } from '@shared/schema';

export function RightPanel() {
  const { 
    selectedGroupId, 
    selectedAgentId, 
    rightPanelOpen,
    setRightPanelOpen,
    setSelectedAgentId 
  } = useUIStore();

  const { data: agents = [] } = useAgents();
  const { data: groups = [] } = useGroups();
  const updateAgentMutation = useUpdateAgent();
  const deleteAgentMutation = useDeleteAgent();
  const removeAgentFromGroupMutation = useRemoveAgentFromGroup();

  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  if (!rightPanelOpen || !selectedAgentId) {
    return null;
  }

  const agent = agents.find((a) => a.id === selectedAgentId);
  if (!agent) {
    return null;
  }

  const selectedGroup = groups.find((g: GroupWithAgents) => g.id === selectedGroupId);
  const isInCurrentGroup = selectedGroup 
    ? selectedGroup.agentIds.includes(selectedAgentId)
    : false;

  const handleClose = () => {
    setSelectedAgentId(null);
    setRightPanelOpen(false);
  };

  const handleEdit = () => {
    setEditingAgent(agent);
  };

  const handleDelete = () => {
    deleteAgentMutation.mutate(agent.id);
    handleClose();
  };

  const handleRemoveFromGroup = () => {
    if (selectedGroupId) {
      removeAgentFromGroupMutation.mutate({ groupId: selectedGroupId, agentId: agent.id });
      handleClose();
    }
  };

  const handleEditSubmit = (data: { name: string; role: string; description?: string; color: string }) => {
    updateAgentMutation.mutate({ id: agent.id, updates: { ...data, description: data.description ?? null } });
    setEditingAgent(null);
  };

  return (
    <>
      <div className="w-80 flex-shrink-0" data-testid="right-panel">
        <AgentDetailPanel
          agent={agent}
          onClose={handleClose}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onRemoveFromGroup={handleRemoveFromGroup}
          showRemoveFromGroup={isInCurrentGroup}
        />
      </div>

      <CreateAgentDialog
        open={editingAgent !== null}
        onOpenChange={(open) => !open && setEditingAgent(null)}
        onSubmit={handleEditSubmit}
        initialValues={editingAgent ? { 
          name: editingAgent.name, 
          role: editingAgent.role, 
          description: editingAgent.description ?? undefined, 
          color: editingAgent.color 
        } : undefined}
        mode="edit"
      />
    </>
  );
}
