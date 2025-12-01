import { ChatMessage } from '../ChatMessage';

export default function ChatMessageExample() {
  const userMessage = {
    id: '1',
    groupId: '1',
    senderId: null,
    senderType: 'user' as const,
    content: 'Hello, can you help me with some research?',
    createdAt: new Date(),
  };

  const agentMessage = {
    id: '2',
    groupId: '1',
    senderId: '1',
    senderType: 'agent' as const,
    content: 'Of course! I would be happy to help with your research. What topic are you interested in exploring?',
    createdAt: new Date(),
  };

  const agent = {
    id: '1',
    name: 'Research Assistant',
    role: 'Researcher',
    description: '',
    color: '#7C3AED',
  };

  return (
    <div className="space-y-4 p-4 max-w-xl">
      <ChatMessage message={agentMessage} agent={agent} />
      <ChatMessage message={userMessage} />
    </div>
  );
}
