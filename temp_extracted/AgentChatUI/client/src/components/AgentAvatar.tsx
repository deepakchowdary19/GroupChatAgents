import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface AgentAvatarProps {
  name: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-20 h-20 text-2xl',
};

export function AgentAvatar({ name, color = '#7C3AED', size = 'md', className = '' }: AgentAvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`} data-testid={`avatar-agent-${name.toLowerCase().replace(/\s+/g, '-')}`}>
      <AvatarFallback 
        style={{ backgroundColor: color }}
        className="text-white font-semibold"
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
