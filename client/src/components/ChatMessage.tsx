import type { Message, Agent } from '@shared/schema';
import { AgentAvatar } from './AgentAvatar';
import { format } from 'date-fns';
import { User, Copy, Check, Bot } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { useState, useCallback } from 'react';

function AssistantAvatar() {
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-lg flex-shrink-0">
      <Bot className="w-4 h-4 text-white" />
    </div>
  );
}

function CriticAvatar({ verdict }: { verdict?: string }) {
  const isApproved = verdict === 'good' || verdict === 'approved';
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg flex-shrink-0 ${
      isApproved 
        ? 'bg-gradient-to-br from-emerald-400 to-green-500' 
        : 'bg-gradient-to-br from-amber-400 to-orange-500'
    }`}>
      <span className="text-white text-sm font-bold">C</span>
    </div>
  );
}

interface ChatMessageProps {
  message: Message;
  agent?: Agent;
}

function CodeBlock({ className, children, ...props }: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const codeString = String(children).replace(/\n$/, '');
  
  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [codeString]);
  
  if (!className) {
    return (
      <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary" {...props}>
        {children}
      </code>
    );
  }
  
  return (
    <div className="relative group my-4">
      <div className="flex items-center justify-between bg-muted/80 px-4 py-2 rounded-t-lg border-b border-border">
        <span className="text-xs font-medium text-muted-foreground uppercase">{language || 'code'}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </div>
      <pre className="bg-muted/50 p-4 rounded-b-lg overflow-x-auto">
        <code className={`${className} text-sm`} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
}

function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={{
        code: CodeBlock,
        h1: ({ children }) => <h1 className="text-xl font-bold mt-4 mb-2 text-foreground">{children}</h1>,
        h2: ({ children }) => <h2 className="text-lg font-semibold mt-3 mb-2 text-foreground">{children}</h2>,
        h3: ({ children }) => <h3 className="text-base font-semibold mt-2 mb-1 text-foreground">{children}</h3>,
        p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
        ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
        li: ({ children }) => <li className="ml-2">{children}</li>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-primary/50 pl-4 italic my-2 text-muted-foreground">
            {children}
          </blockquote>
        ),
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            {children}
          </a>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-4">
            <table className="min-w-full border border-border rounded-lg">
              {children}
            </table>
          </div>
        ),
        th: ({ children }) => (
          <th className="bg-muted px-4 py-2 text-left font-semibold border-b border-border">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-4 py-2 border-b border-border">
            {children}
          </td>
        ),
        strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        hr: () => <hr className="my-4 border-border" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
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
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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

  const isCritic = agent?.agent_type === 'critic' || agent?.name?.toLowerCase().includes('critic');
  
  let parsedCriticContent = null;
  if (isCritic && message.content) {
    try {
      parsedCriticContent = JSON.parse(message.content);
    } catch {
      parsedCriticContent = null;
    }
  }

  return (
    <div className="flex justify-start" data-testid={`message-agent-${message.id}`}>
      <div className="flex items-start gap-3 max-w-3xl w-full">
        {agent ? (
          isCritic ? (
            <CriticAvatar verdict={parsedCriticContent?.verdict} />
          ) : (
            <AgentAvatar name={agent.name} color={agent.color} size="sm" />
          )
        ) : (
          <AssistantAvatar />
        )}
        <div className="flex flex-col flex-1 min-w-0">
          {agent ? (
            <div className="flex items-center gap-2 mb-1">
              <span className={`font-semibold text-sm ${
                isCritic 
                  ? parsedCriticContent?.verdict === 'good' || parsedCriticContent?.verdict === 'approved'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
                  : ''
              }`}>{agent.name}</span>
              <span className="text-xs text-muted-foreground">{agent.role}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                AI Assistant
              </span>
            </div>
          )}
          <div className={`px-4 py-3 rounded-2xl rounded-tl-md shadow-sm ${
            isCritic
              ? parsedCriticContent?.verdict === 'good' || parsedCriticContent?.verdict === 'approved'
                ? 'bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/40 dark:to-green-950/40 border border-emerald-200 dark:border-emerald-800/50'
                : 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-200 dark:border-amber-800/50'
              : 'bg-card border border-border'
          }`}>
            {parsedCriticContent ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    parsedCriticContent.verdict === 'good' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : parsedCriticContent.verdict === 'needs_revision'
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {parsedCriticContent.verdict === 'good' ? 'Approved' : 
                     parsedCriticContent.verdict === 'needs_revision' ? 'Needs Revision' : 
                     parsedCriticContent.verdict}
                  </span>
                </div>
                {parsedCriticContent.feedback && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Feedback</span>
                    <p className="text-sm mt-1">{parsedCriticContent.feedback}</p>
                  </div>
                )}
                {parsedCriticContent.evidence && parsedCriticContent.evidence.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Evidence</span>
                    <ul className="text-sm mt-1 list-disc list-inside space-y-1">
                      {parsedCriticContent.evidence.map((e: string, i: number) => (
                        <li key={i} className="text-muted-foreground">{e}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {parsedCriticContent.sources && parsedCriticContent.sources.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sources</span>
                    <ul className="text-sm mt-1 space-y-1">
                      {parsedCriticContent.sources.map((s: string, i: number) => (
                        <li key={i}>
                          <a href={s} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs break-all">
                            {s}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                <MarkdownContent content={message.content} />
              </div>
            )}
          </div>
          <span className="text-xs text-muted-foreground mt-1">{timestamp}</span>
        </div>
      </div>
    </div>
  );
}
