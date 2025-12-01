import { useState } from 'react';
import { AddAgentToGroupDialog } from '../AddAgentToGroupDialog';
import { Button } from '@/components/ui/button';

export default function AddAgentToGroupDialogExample() {
  const [open, setOpen] = useState(true);

  const agents = [
    { id: '1', name: 'Research Assistant', role: 'Researcher', description: '', color: '#7C3AED' },
    { id: '2', name: 'Code Helper', role: 'Developer', description: '', color: '#2563EB' },
    { id: '3', name: 'Writer Bot', role: 'Writer', description: '', color: '#059669' },
  ];

  return (
    <div className="p-4">
      <Button onClick={() => setOpen(true)}>Open Add Agent Dialog</Button>
      <AddAgentToGroupDialog
        open={open}
        onOpenChange={setOpen}
        onSubmit={(agentIds) => console.log('Adding agents:', agentIds)}
        availableAgents={agents}
        currentAgentIds={['1']}
      />
    </div>
  );
}
