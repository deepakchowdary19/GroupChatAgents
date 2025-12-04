import { useEffect, useRef, useState } from 'react';
import { useUIStore } from '@/lib/store';
import { useAgents, useGroups, useMessages, useSendMessage, useDeleteGroupMessages, type GroupWithAgents } from '@/lib/hooks';
import { queryClient } from '@/lib/queryClient';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { EmptyState } from './EmptyState';
import { AgentAvatar } from './AgentAvatar';
import { TypingIndicator } from './TypingIndicator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PanelRightOpen, Users, Loader2, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Agent, Message } from '@shared/schema';

export function ChatArea() {
  const { selectedGroupId, rightPanelOpen, setRightPanelOpen, setSelectedAgentId } = useUIStore();

  const { data: agents = [] } = useAgents();
  const { data: groups = [] } = useGroups();
  const { data: messages = [], isLoading: messagesLoading } = useMessages(selectedGroupId);
  const sendMessageMutation = useSendMessage();
  const deleteMessagesMutation = useDeleteGroupMessages();

  const [optimisticUserMessage, setOptimisticUserMessage] = useState<Message | null>(null);
  const [memoryType, setMemoryType] = useState<"short" | "long">("long");
  const [streamingContent, setStreamingContent] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);

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
  }, [messages.length, optimisticUserMessage, sendMessageMutation.isPending]);

  const handleSendMessage = async (content: string) => {
    if (selectedGroupId) {
      const newOptimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        groupId: selectedGroupId,
        senderId: null,
        senderType: 'user',
        content,
        createdAt: new Date().toISOString(),
      };
      setOptimisticUserMessage(newOptimisticMessage);
      setIsStreaming(true);

      let responderContent = "";
      let criticResponse: any = null;

      try {
        const response = await fetch('/api/chat/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: content,
            memory_type: memoryType,
            group_id: selectedGroupId,
          }),
        });

        if (!response.body) throw new Error('No response body');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim()) {
              try {
                const data = JSON.parse(line);
                if (data.type === 'responder') {
                  responderContent = data.content;
                  setStreamingContent(responderContent);
                } else if (data.type === 'critic') {
                  criticResponse = data.content;
                }
              } catch (e) {
                console.error('Error parsing JSON:', e);
              }
            }
          }
        }

      } catch (error) {
        console.error('Streaming error:', error);
      } finally {
        setIsStreaming(false);
        setOptimisticUserMessage(null);
        setStreamingContent("");
        // Refetch messages to show the saved messages from backend
        queryClient.invalidateQueries({ queryKey: ['/api/groups', selectedGroupId, 'messages'] });
      }
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
          <Select value={memoryType} onValueChange={(v: "short" | "long") => setMemoryType(v)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Memory Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="long">Long Term</SelectItem>
              <SelectItem value="short">Short Term</SelectItem>
            </SelectContent>
          </Select>
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
            onClick={() => {
              if (confirm('Delete all chat history for this group?')) {
                deleteMessagesMutation.mutate(selectedGroupId!);
              }
            }}
            title="Delete chat history"
            data-testid="button-delete-history"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
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
          ) : messages.length === 0 && !optimisticUserMessage ? (
            <EmptyState type="no-messages" />
          ) : (
            <>
              {messages.map((message) => {
                const agent = message.senderId
                  ? agents.find((a) => a.id === message.senderId)
                  : undefined;
                return (
                  <ChatMessage key={message.id} message={message} agent={agent} />
                );
              })}
              {optimisticUserMessage && (
                <ChatMessage message={optimisticUserMessage} />
              )}
              {isStreaming && (
                <div className="flex gap-3 p-4 rounded-lg bg-muted/50">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">Assistant</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <span className="inline-flex gap-0.5">
                          <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                          <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                          <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                        </span>
                        typing
                      </span>
                    </div>
                    <div className="text-sm whitespace-pre-wrap">{streamingContent}</div>
                  </div>
                </div>
              )}
              {sendMessageMutation.isPending && groupAgentsList.length > 0 && (
                <>
                  {groupAgentsList.map((agent) => (
                    <TypingIndicator key={agent.id} agent={agent} />
                  ))}
                </>
              )}
            </>
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
