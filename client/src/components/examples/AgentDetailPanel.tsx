import { AgentDetailPanel } from '../AgentDetailPanel';

export default function AgentDetailPanelExample() {
  const agent = {
    id: '1',
    name: 'Research Assistant',
    role: 'Researcher',
    description: 'I help with research tasks, finding information, summarizing documents, and providing insights on various topics.',
    color: '#7C3AED',
  };

  return (
    <div className="w-80 h-[500px] border rounded-lg overflow-hidden">
      <AgentDetailPanel
        agent={agent}
        onClose={() => console.log('Close panel')}
        onEdit={() => console.log('Edit agent')}
        onDelete={() => console.log('Delete agent')}
        onRemoveFromGroup={() => console.log('Remove from group')}
        showRemoveFromGroup
      />
    </div>
  );
}
