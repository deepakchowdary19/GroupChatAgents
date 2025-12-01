import type { Agent } from '@shared/schema';
import { AgentAvatar } from './AgentAvatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Trash2, Edit2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AgentCardProps {
  agent: Agent;
  isSelected?: boolean;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function AgentCard({ agent, isSelected, onClick, onEdit, onDelete }: AgentCardProps) {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-md cursor-pointer hover-elevate transition-colors ${
        isSelected ? 'bg-sidebar-accent' : ''
      }`}
      onClick={onClick}
      data-testid={`card-agent-${agent.id}`}
    >
      <AgentAvatar name={agent.name} color={agent.color} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{agent.name}</p>
        <Badge variant="secondary" className="text-xs mt-0.5">
          {agent.role}
        </Badge>
      </div>
      {(onEdit || onDelete) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button size="icon" variant="ghost" className="h-8 w-8" data-testid={`button-agent-menu-${agent.id}`}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }} data-testid={`button-edit-agent-${agent.id}`}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); onDelete(); }} 
                className="text-destructive"
                data-testid={`button-delete-agent-${agent.id}`}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
