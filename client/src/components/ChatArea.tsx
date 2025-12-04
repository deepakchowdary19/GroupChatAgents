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
import { PanelRightOpen, Users, Loader2, Trash2, Sparkles, Brain, Bot } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Agent, Message } from '@shared/schema';

function AssistantAvatar({ size = 'md', isThinking = false }: { size?: 'sm' | 'md'; isThinking?: boolean }) {
  const sizeClasses = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  
  return (
    <div className={`${sizeClasses} rounded-full bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-lg ${isThinking ? 'animate-pulse' : ''}`}>
      <Bot className={`${iconSize} text-white`} />
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex gap-4 p-5 rounded-2xl bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/40 border border-violet-100 dark:border-violet-800/50 shadow-sm">
      <div className="relative">
        <AssistantAvatar isThinking={true} />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full flex items-center justify-center animate-bounce">
          <Sparkles className="w-2.5 h-2.5 text-white" />
        </div>
      </div>
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
            AI Assistant
          </span>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Brain className="w-3.5 h-3.5 text-violet-500 animate-pulse" />
            <span>Thinking</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <div className="h-2 flex-1 max-w-[200px] bg-gradient-to-r from-violet-200 via-purple-200 to-violet-200 dark:from-violet-800 dark:via-purple-800 dark:to-violet-800 rounded-full overflow-hidden">
            <div className="h-full w-1/2 bg-gradient-to-r from-violet-400 to-purple-500 rounded-full animate-[shimmer_1.5s_ease-in-out_infinite]" 
                 style={{ animation: 'shimmer 1.5s ease-in-out infinite' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

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
  
  // Track all iterations for display
  interface StreamIteration {
    iteration: number;
    response: string;
    criticVerdict?: string;
    criticFeedback?: string;
    isRevision: boolean;
  }
  const [streamIterations, setStreamIterations] = useState<StreamIteration[]>([]);
  const [currentIteration, setCurrentIteration] = useState(0);

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
  }, [messages.length, optimisticUserMessage, sendMessageMutation.isPending, streamIterations.length]);

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
      setStreamIterations([]);
      setCurrentIteration(0);

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
                  const iteration = data.iteration || 1;
                  console.log(`[UI] Received responder iteration ${iteration}:`, data.content.substring(0, 100));
                  setCurrentIteration(iteration);
                  setStreamingContent(data.content);
                  
                  // Add or update iteration in the list
                  setStreamIterations(prev => {
                    const existing = prev.find(i => i.iteration === iteration);
                    if (existing) {
                      console.log(`[UI] Updating existing iteration ${iteration}`);
                      return prev.map(i => i.iteration === iteration 
                        ? { ...i, response: data.content }
                        : i
                      );
                    }
                    console.log(`[UI] Adding new iteration ${iteration}. Total iterations: ${prev.length + 1}`);
                    return [...prev, {
                      iteration,
                      response: data.content,
                      isRevision: data.is_revision || false
                    }];
                  });
                } else if (data.type === 'critic') {
                  const iteration = data.iteration || currentIteration;
                  console.log(`[UI] Received critic feedback for iteration ${iteration}:`, data.verdict);
                  // Update the iteration with critic feedback
                  setStreamIterations(prev => 
                    prev.map(i => i.iteration === iteration 
                      ? { 
                          ...i, 
                          criticVerdict: data.verdict,
                          criticFeedback: data.feedback 
                        }
                      : i
                    )
                  );
                } else if (data.type === 'complete') {
                  console.log(`[UI] Completed with ${data.total_iterations} iterations`);
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
        setStreamIterations([]);
        setCurrentIteration(0);
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
              {isStreaming && streamIterations.length > 0 && (
                <div className="space-y-4">
                  {[...streamIterations].sort((a, b) => a.iteration - b.iteration).map((iter, idx) => (
                    <div key={`iteration-${iter.iteration}`} className="space-y-3">
                      {/* Agent Response */}
                      <div className="flex gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50 border border-slate-200 dark:border-slate-700/50 shadow-sm">
                        <div className="relative flex-shrink-0">
                          <AssistantAvatar size="md" isThinking={idx === streamIterations.length - 1 && !iter.criticVerdict} />
                          {idx === streamIterations.length - 1 && !iter.criticVerdict && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full flex items-center justify-center animate-bounce">
                              <Sparkles className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-2 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                              AI Assistant
                            </span>
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                              iter.isRevision 
                                ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300' 
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                            }`}>
                              {iter.isRevision ? `Revision ${iter.iteration - 1}` : 'Initial Response'}
                            </span>
                            {idx === streamIterations.length - 1 && !iter.criticVerdict && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Brain className="w-3.5 h-3.5 text-violet-500 animate-pulse" />
                                <span>Awaiting review...</span>
                              </div>
                            )}
                          </div>
                          <div className="text-sm whitespace-pre-wrap leading-relaxed">{iter.response}</div>
                        </div>
                      </div>
                      
                      {/* Critic Response */}
                      {iter.criticVerdict && (
                        <div className={`flex gap-4 p-4 rounded-xl ml-6 border shadow-sm ${
                          iter.criticVerdict === 'good' || iter.criticVerdict === 'approved'
                            ? 'bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/40 dark:to-green-950/40 border-emerald-200 dark:border-emerald-800/50'
                            : 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border-amber-200 dark:border-amber-800/50'
                        }`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            iter.criticVerdict === 'good' || iter.criticVerdict === 'approved'
                              ? 'bg-gradient-to-br from-emerald-400 to-green-500'
                              : 'bg-gradient-to-br from-amber-400 to-orange-500'
                          }`}>
                            <span className="text-white text-sm font-bold">C</span>
                          </div>
                          <div className="flex-1 space-y-2 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-semibold text-sm ${
                                iter.criticVerdict === 'good' || iter.criticVerdict === 'approved'
                                  ? 'text-emerald-700 dark:text-emerald-300'
                                  : 'text-amber-700 dark:text-amber-300'
                              }`}>Critic Agent</span>
                              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                                iter.criticVerdict === 'good' || iter.criticVerdict === 'approved' 
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' 
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                              }`}>
                                {iter.criticVerdict === 'good' || iter.criticVerdict === 'approved' ? 'Approved' : 'Needs Revision'}
                              </span>
                            </div>
                            {iter.criticFeedback && (
                              <div className="text-sm text-muted-foreground leading-relaxed">{iter.criticFeedback}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Show beautiful thinking indicator when waiting for first response */}
              {isStreaming && streamIterations.length === 0 && (
                <ThinkingIndicator />
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
