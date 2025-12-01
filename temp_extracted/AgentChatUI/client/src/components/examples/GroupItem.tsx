import { GroupItem } from '../GroupItem';

export default function GroupItemExample() {
  const group = { id: '1', name: 'Project Alpha', description: 'Main project discussion' };
  const agents = [
    { id: '1', name: 'Research Assistant', role: 'Researcher', description: '', color: '#7C3AED' },
    { id: '2', name: 'Code Helper', role: 'Developer', description: '', color: '#2563EB' },
  ];

  return (
    <div className="w-64 bg-sidebar p-2 rounded-lg">
      <GroupItem 
        group={group}
        agents={agents}
        isSelected
        onSelect={() => console.log('Group selected')}
        onEdit={() => console.log('Edit clicked')}
        onDelete={() => console.log('Delete clicked')}
        onAddAgent={() => console.log('Add agent clicked')}
        onAgentClick={(id) => console.log('Agent clicked:', id)}
      />
    </div>
  );
}
