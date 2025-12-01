import { AgentAvatar } from '../AgentAvatar';

export default function AgentAvatarExample() {
  return (
    <div className="flex items-center gap-4 p-4">
      <AgentAvatar name="Research Assistant" color="#7C3AED" size="sm" />
      <AgentAvatar name="Code Helper" color="#2563EB" size="md" />
      <AgentAvatar name="Writer Bot" color="#059669" size="lg" />
    </div>
  );
}
