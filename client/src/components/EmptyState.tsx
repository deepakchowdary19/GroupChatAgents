import { Button } from '@/components/ui/button';
import { Users, MessageSquare, Plus } from 'lucide-react';

interface EmptyStateProps {
  type: 'no-groups' | 'no-agents' | 'no-messages' | 'select-group';
  onAction?: () => void;
}

const emptyStates = {
  'no-groups': {
    icon: Users,
    title: 'No Groups Yet',
    description: 'Create your first group to start chatting with AI agents.',
    actionLabel: 'Create Group',
  },
  'no-agents': {
    icon: Users,
    title: 'No Agents Yet',
    description: 'Create your first AI agent to get started.',
    actionLabel: 'Create Agent',
  },
  'no-messages': {
    icon: MessageSquare,
    title: 'Start a Conversation',
    description: 'Send a message to start chatting with the agents in this group.',
    actionLabel: undefined,
  },
  'select-group': {
    icon: MessageSquare,
    title: 'Select a Group',
    description: 'Choose a group from the sidebar to view the conversation.',
    actionLabel: undefined,
  },
};

export function EmptyState({ type, onAction }: EmptyStateProps) {
  const state = emptyStates[type];
  const Icon = state.icon;

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center" data-testid={`empty-state-${type}`}>
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{state.title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm">{state.description}</p>
      {state.actionLabel && onAction && (
        <Button onClick={onAction} data-testid={`button-empty-state-action-${type}`}>
          <Plus className="h-4 w-4 mr-2" />
          {state.actionLabel}
        </Button>
      )}
    </div>
  );
}
