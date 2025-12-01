import { useEffect, useRef } from 'react';
import { useUIStore } from '@/lib/store';
import { useAgents, useGroups, useMessages, useSendMessage, type GroupWithAgents } from '@/lib/hooks';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { EmptyState } from './EmptyState';
import { AgentAvatar } from './AgentAvatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PanelRightOpen, Users, Loader2 } from 'lucide-react';
import type { Agent } from '@shared/schema';

export function ChatArea() {
  const { selectedGroupId, rightPanelOpen, setRightPanelOpen, setSelectedAgentId } = useUIStore();
  
  const { data: agents = [] } = useAgents();
  const { data: groups = [] } = useGroups();
  const { data: messages = [], isLoading: messagesLoading } = useMessages(selectedGroupId);
  const sendMessageMutation = useSendMessage();

  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedGroup = groups.find((g: GroupWithAgents) => g.id === selectedGroupId);
  const groupAgentsList = selectedGroup 
    ? selectedGroup.agentIds
        .map((id) => agents.find((a) => a.id === id))
        .filter((a): a is Agent => a !== undefined)
    : [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSendMessage = (content: string) => {
    if (selectedGroupId) {
      sendMessageMutation.mutate({ groupId: selectedGroupId, content });
    }
  };

  if (!selectedGroup) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <EmptyState type="select-group" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background" data-testid="chat-area">
      <header className="h-14 flex items-center justify-between gap-4 px-4 border-b">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex -space-x-2">
            {groupAgentsList.slice(0, 3).map((agent) => (
              <AgentAvatar 
                key={agent.id} 
                name={agent.name} 
                color={agent.color} 
                size="sm" 
                className="border-2 border-background"
              />
            ))}
            {groupAgentsList.length > 3 && (
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background">
                +{groupAgentsList.length - 3}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold truncate" data-testid="text-group-name">{selectedGroup.name}</h2>
            <p className="text-xs text-muted-foreground">
              {groupAgentsList.length} agent{groupAgentsList.length !== 1 ? 's' : ''} in group
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1">
            {groupAgentsList.slice(0, 3).map((agent) => (
              <Badge 
                key={agent.id} 
                variant="secondary" 
                className="cursor-pointer"
                onClick={() => setSelectedAgentId(agent.id)}
                data-testid={`badge-agent-${agent.id}`}
              >
                {agent.name}
              </Badge>
            ))}
          </div>
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
            data-testid="button-toggle-right-panel"
          >
            {rightPanelOpen ? <Users className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 space-y-4">
          {messagesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <EmptyState type="no-messages" />
          ) : (
            messages.map((message) => {
              const agent = message.senderId 
                ? agents.find((a) => a.id === message.senderId) 
                : undefined;
              return (
                <ChatMessage key={message.id} message={message} agent={agent} />
              );
            })
          )}
        </div>
      </ScrollArea>

      <ChatInput
        onSend={handleSendMessage}
        disabled={groupAgentsList.length === 0 || sendMessageMutation.isPending}
        placeholder={
          groupAgentsList.length === 0 
            ? 'Add agents to this group to start chatting...' 
            : sendMessageMutation.isPending 
            ? 'Sending...' 
            : 'Type a message to chat with the agents...'
        }
      />
    </div>
  );
}
