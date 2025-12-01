import type { Group, Agent } from '@shared/schema';
import { AgentAvatar } from './AgentAvatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, MoreHorizontal, Trash2, Edit2, UserPlus } from 'lucide-react';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface GroupItemProps {
  group: Group;
  agents: Agent[];
  isSelected?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onAddAgent?: () => void;
  onAgentClick?: (agentId: string) => void;
}

export function GroupItem({ 
  group, 
  agents, 
  isSelected, 
  onSelect, 
  onEdit, 
  onDelete, 
  onAddAgent,
  onAgentClick 
}: GroupItemProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-1">
      <div
        className={`flex items-center gap-2 p-2 rounded-md cursor-pointer hover-elevate transition-colors ${
          isSelected ? 'bg-sidebar-accent' : ''
        }`}
        onClick={onSelect}
        data-testid={`item-group-${group.id}`}
      >
        <CollapsibleTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button size="icon" variant="ghost" className="h-6 w-6" data-testid={`button-toggle-group-${group.id}`}>
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{group.name}</p>
        </div>
        <Badge variant="secondary" className="text-xs">
          {agents.length}
        </Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button size="icon" variant="ghost" className="h-6 w-6" data-testid={`button-group-menu-${group.id}`}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onAddAgent && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAddAgent(); }} data-testid={`button-add-agent-to-group-${group.id}`}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Agent
              </DropdownMenuItem>
            )}
            {onEdit && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }} data-testid={`button-edit-group-${group.id}`}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Group
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); onDelete(); }} 
                className="text-destructive"
                data-testid={`button-delete-group-${group.id}`}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Group
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <CollapsibleContent className="pl-8 space-y-1">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="flex items-center gap-2 p-1.5 rounded-md cursor-pointer hover-elevate"
            onClick={() => onAgentClick?.(agent.id)}
            data-testid={`item-group-agent-${agent.id}`}
          >
            <AgentAvatar name={agent.name} color={agent.color} size="sm" />
            <span className="text-sm truncate">{agent.name}</span>
          </div>
        ))}
        {agents.length === 0 && (
          <p className="text-xs text-muted-foreground py-2">No agents in this group</p>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
