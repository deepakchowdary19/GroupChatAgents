import type { Message, Agent } from '@shared/schema';
import { AgentAvatar } from './AgentAvatar';
import { format } from 'date-fns';
import { User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface ChatMessageProps {
  message: Message;
  agent?: Agent;
}

export function ChatMessage({ message, agent }: ChatMessageProps) {
  const isUser = message.senderType === 'user';
  const timestamp = message.createdAt ? format(new Date(message.createdAt), 'HH:mm') : '';

  if (isUser) {
    return (
      <div className="flex justify-end" data-testid={`message-user-${message.id}`}>
        <div className="flex items-end gap-2 max-w-2xl">
          <div className="flex flex-col items-end">
            <div className="bg-primary text-primary-foreground px-4 py-3 rounded-2xl rounded-br-md">
              <p className="text-sm">{message.content}</p>
            </div>
            <span className="text-xs text-muted-foreground mt-1">{timestamp}</span>
          </div>
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-muted">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start" data-testid={`message-agent-${message.id}`}>
      <div className="flex items-start gap-2 max-w-2xl">
        {agent ? (
          <AgentAvatar name={agent.name} color={agent.color} size="sm" />
        ) : (
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-muted">AI</AvatarFallback>
          </Avatar>
        )}
        <div className="flex flex-col">
          {agent && (
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm">{agent.name}</span>
              <span className="text-xs text-muted-foreground">{agent.role}</span>
            </div>
          )}
          <div className="bg-card border border-card-border px-4 py-3 rounded-2xl rounded-tl-md">
            <p className="text-sm">{message.content}</p>
          </div>
          <span className="text-xs text-muted-foreground mt-1">{timestamp}</span>
        </div>
      </div>
    </div>
  );
}
