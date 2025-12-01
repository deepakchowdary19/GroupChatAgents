import type { Agent } from '@shared/schema';
import { AgentAvatar } from './AgentAvatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Edit2, Trash2, UserMinus } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface AgentDetailPanelProps {
  agent: Agent;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onRemoveFromGroup?: () => void;
  showRemoveFromGroup?: boolean;
}

export function AgentDetailPanel({ 
  agent, 
  onClose, 
  onEdit, 
  onDelete,
  onRemoveFromGroup,
  showRemoveFromGroup 
}: AgentDetailPanelProps) {
  return (
    <div className="h-full flex flex-col bg-background border-l" data-testid="panel-agent-detail">
      <div className="flex items-center justify-between gap-2 p-4 border-b">
        <h2 className="font-semibold">Agent Details</h2>
        <Button size="icon" variant="ghost" onClick={onClose} data-testid="button-close-panel">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex flex-col items-center text-center mb-6">
          <AgentAvatar name={agent.name} color={agent.color} size="lg" />
          <h3 className="text-xl font-semibold mt-4">{agent.name}</h3>
          <Badge variant="secondary" className="mt-2">{agent.role}</Badge>
        </div>
        <Separator className="my-4" />
        {agent.description && (
          <>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
              <p className="text-sm">{agent.description}</p>
            </div>
            <Separator className="my-4" />
          </>
        )}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Actions</h4>
          <div className="space-y-2">
            {onEdit && (
              <Button variant="outline" className="w-full justify-start" onClick={onEdit} data-testid="button-edit-agent-panel">
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Agent
              </Button>
            )}
            {showRemoveFromGroup && onRemoveFromGroup && (
              <Button variant="outline" className="w-full justify-start" onClick={onRemoveFromGroup} data-testid="button-remove-from-group">
                <UserMinus className="h-4 w-4 mr-2" />
                Remove from Group
              </Button>
            )}
            {onDelete && (
              <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive" onClick={onDelete} data-testid="button-delete-agent-panel">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Agent
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
