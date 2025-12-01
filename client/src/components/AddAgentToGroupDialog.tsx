import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { AgentAvatar } from './AgentAvatar';
import type { Agent } from '@shared/schema';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AddAgentToGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (agentIds: string[]) => void;
  availableAgents: Agent[];
  currentAgentIds: string[];
}

export function AddAgentToGroupDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  availableAgents,
  currentAgentIds 
}: AddAgentToGroupDialogProps) {
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);

  const agentsNotInGroup = availableAgents.filter((a) => !currentAgentIds.includes(a.id));

  const toggleAgent = (agentId: string) => {
    setSelectedAgentIds((prev) =>
      prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(selectedAgentIds);
    setSelectedAgentIds([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="dialog-add-agent-to-group">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Agents to Group</DialogTitle>
            <DialogDescription>
              Select agents to add to this group.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <ScrollArea className="h-64 border rounded-md p-2">
              {agentsNotInGroup.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4 text-center">
                  All agents are already in this group.
                </p>
              ) : (
                <div className="space-y-2">
                  {agentsNotInGroup.map((agent) => (
                    <div
                      key={agent.id}
                      className={`flex items-center gap-3 p-3 rounded-md cursor-pointer border transition-colors ${
                        selectedAgentIds.includes(agent.id) 
                          ? 'border-primary bg-primary/5' 
                          : 'border-transparent hover:bg-muted'
                      }`}
                      onClick={() => toggleAgent(agent.id)}
                      data-testid={`checkbox-add-agent-${agent.id}`}
                    >
                      <Checkbox
                        checked={selectedAgentIds.includes(agent.id)}
                        onCheckedChange={() => toggleAgent(agent.id)}
                      />
                      <AgentAvatar name={agent.name} color={agent.color} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{agent.name}</p>
                        <p className="text-xs text-muted-foreground">{agent.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-add-agent">
              Cancel
            </Button>
            <Button type="submit" disabled={selectedAgentIds.length === 0} data-testid="button-submit-add-agent">
              Add {selectedAgentIds.length > 0 ? `(${selectedAgentIds.length})` : ''} Agents
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
