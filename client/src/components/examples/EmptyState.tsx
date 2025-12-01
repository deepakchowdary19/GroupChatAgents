import { EmptyState } from '../EmptyState';

export default function EmptyStateExample() {
  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      <div className="h-64 border rounded-lg">
        <EmptyState type="no-groups" onAction={() => console.log('Create group')} />
      </div>
      <div className="h-64 border rounded-lg">
        <EmptyState type="no-agents" onAction={() => console.log('Create agent')} />
      </div>
      <div className="h-64 border rounded-lg">
        <EmptyState type="no-messages" />
      </div>
      <div className="h-64 border rounded-lg">
        <EmptyState type="select-group" />
      </div>
    </div>
  );
}
