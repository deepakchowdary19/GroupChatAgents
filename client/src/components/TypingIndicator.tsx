import { Agent } from '@shared/schema';
import { AgentAvatar } from './AgentAvatar';

interface TypingIndicatorProps {
  agent: Agent;
}

export function TypingIndicator({ agent }: TypingIndicatorProps) {
  return (
    <div className="flex justify-start">
      <div className="flex items-start gap-2 max-w-2xl">
        <AgentAvatar name={agent.name} color={agent.color} size="sm" />
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm">{agent.name}</span>
            <span className="text-xs text-muted-foreground">{agent.role}</span>
          </div>
          <div className="bg-card border border-card-border px-4 py-3 rounded-2xl rounded-tl-md flex items-center gap-1">
            <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </div>
        </div>
      </div>
    </div>
  );
}
