import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CreateAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (agent: { name: string; role: string; description?: string; color: string }) => void;
  initialValues?: { name: string; role: string; description?: string; color: string };
  mode?: 'create' | 'edit';
}

const colorOptions = [
  '#7C3AED', '#2563EB', '#059669', '#DC2626', '#D97706', '#7C2D12', '#4F46E5', '#0891B2'
];

export function CreateAgentDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  initialValues,
  mode = 'create' 
}: CreateAgentDialogProps) {
  const [name, setName] = useState(initialValues?.name || '');
  const [role, setRole] = useState(initialValues?.role || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [color, setColor] = useState(initialValues?.color || colorOptions[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && role.trim()) {
      onSubmit({ name: name.trim(), role: role.trim(), description: description.trim() || undefined, color });
      if (mode === 'create') {
        setName('');
        setRole('');
        setDescription('');
        setColor(colorOptions[0]);
      }
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="dialog-create-agent">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{mode === 'create' ? 'Create New Agent' : 'Edit Agent'}</DialogTitle>
            <DialogDescription>
              {mode === 'create' 
                ? 'Add a new AI agent to your workspace.' 
                : 'Update the agent details.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Research Assistant"
                required
                data-testid="input-agent-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g., Researcher, Developer, Writer"
                required
                data-testid="input-agent-role"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this agent does..."
                rows={3}
                data-testid="input-agent-description"
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${
                      color === c ? 'scale-110 border-foreground' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                    data-testid={`button-color-${c.replace('#', '')}`}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-agent">
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || !role.trim()} data-testid="button-submit-agent">
              {mode === 'create' ? 'Create Agent' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
