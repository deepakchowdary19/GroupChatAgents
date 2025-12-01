import { useState } from 'react';
import { CreateAgentDialog } from '../CreateAgentDialog';
import { Button } from '@/components/ui/button';

export default function CreateAgentDialogExample() {
  const [open, setOpen] = useState(true);

  return (
    <div className="p-4">
      <Button onClick={() => setOpen(true)}>Open Create Agent Dialog</Button>
      <CreateAgentDialog
        open={open}
        onOpenChange={setOpen}
        onSubmit={(agent) => console.log('Agent created:', agent)}
      />
    </div>
  );
}
