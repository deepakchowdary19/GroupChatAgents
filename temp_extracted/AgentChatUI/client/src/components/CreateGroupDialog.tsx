import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (group: { name: string; description?: string }, agentIds: string[]) => void;
  agents: Agent[];
  initialValues?: { name: string; description?: string };
  initialAgentIds?: string[];
  mode?: 'create' | 'edit';
}

export function CreateGroupDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  agents,
  initialValues,
  initialAgentIds = [],
  mode = 'create' 
}: CreateGroupDialogProps) {
  const [name, setName] = useState(initialValues?.name || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>(initialAgentIds);

  const toggleAgent = (agentId: string) => {
    setSelectedAgentIds((prev) =>
      prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit({ name: name.trim(), description: description.trim() || undefined }, selectedAgentIds);
      if (mode === 'create') {
        setName('');
        setDescription('');
        setSelectedAgentIds([]);
      }
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" data-testid="dialog-create-group">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{mode === 'create' ? 'Create New Group' : 'Edit Group'}</DialogTitle>
            <DialogDescription>
              {mode === 'create' 
                ? 'Create a group chat with AI agents.' 
                : 'Update the group details.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">Group Name</Label>
              <Input
                id="group-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Project Alpha"
                required
                data-testid="input-group-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-description">Description (optional)</Label>
              <Textarea
                id="group-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this group for?"
                rows={2}
                data-testid="input-group-description"
              />
            </div>
            <div className="space-y-2">
              <Label>Select Agents ({selectedAgentIds.length} selected)</Label>
              <ScrollArea className="h-48 border rounded-md p-2">
                {agents.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-2">
                    No agents available. Create agents first.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {agents.map((agent) => (
                      <label
                        key={agent.id}
                        className={`flex items-center gap-2 p-2 rounded-md cursor-pointer border transition-colors ${
                          selectedAgentIds.includes(agent.id) 
                            ? 'border-primary bg-primary/5' 
                            : 'border-transparent hover:bg-muted'
                        }`}
                        data-testid={`checkbox-agent-${agent.id}`}
                      >
                        <Checkbox
                          checked={selectedAgentIds.includes(agent.id)}
                          onCheckedChange={() => toggleAgent(agent.id)}
                        />
                        <AgentAvatar name={agent.name} color={agent.color} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{agent.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{agent.role}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-group">
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()} data-testid="button-submit-group">
              {mode === 'create' ? 'Create Group' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
