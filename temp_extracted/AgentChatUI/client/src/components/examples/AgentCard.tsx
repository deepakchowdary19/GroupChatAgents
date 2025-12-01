import { AgentCard } from '../AgentCard';

export default function AgentCardExample() {
  const agent = {
    id: '1',
    name: 'Research Assistant',
    role: 'Researcher',
    description: 'Helps with research tasks',
    color: '#7C3AED',
  };

  return (
    <div className="w-64 bg-sidebar p-2 rounded-lg">
      <AgentCard 
        agent={agent} 
        onClick={() => console.log('Agent clicked')}
        onEdit={() => console.log('Edit clicked')}
        onDelete={() => console.log('Delete clicked')}
      />
    </div>
  );
}
