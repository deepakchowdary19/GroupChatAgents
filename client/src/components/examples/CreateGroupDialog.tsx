import { useState } from 'react';
import { CreateGroupDialog } from '../CreateGroupDialog';
import { Button } from '@/components/ui/button';

export default function CreateGroupDialogExample() {
  const [open, setOpen] = useState(true);

  const agents = [
    { id: '1', name: 'Research Assistant', role: 'Researcher', description: '', color: '#7C3AED' },
    { id: '2', name: 'Code Helper', role: 'Developer', description: '', color: '#2563EB' },
    { id: '3', name: 'Writer Bot', role: 'Writer', description: '', color: '#059669' },
    { id: '4', name: 'Data Analyst', role: 'Analyst', description: '', color: '#DC2626' },
  ];

  return (
    <div className="p-4">
      <Button onClick={() => setOpen(true)}>Open Create Group Dialog</Button>
      <CreateGroupDialog
        open={open}
        onOpenChange={setOpen}
        onSubmit={(group, agentIds) => console.log('Group created:', group, 'with agents:', agentIds)}
        agents={agents}
      />
    </div>
  );
}
