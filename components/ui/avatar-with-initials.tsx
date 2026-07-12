/**
 * Avatar with Initials Component
 * 
 * Displays user avatar with initials and consistent color based on name
 */

import { cn } from '@/lib/utils';

interface AvatarWithInitialsProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-sm',
  xl: 'w-16 h-16 text-base',
};

export function AvatarWithInitials({ name, size = 'md', className }: AvatarWithInitialsProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const getAvatarColor = (name: string) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-purple-500 to-purple-600',
      'from-pink-500 to-pink-600',
      'from-green-500 to-green-600',
      'from-yellow-500 to-yellow-600',
      'from-red-500 to-red-600',
      'from-indigo-500 to-indigo-600',
      'from-teal-500 to-teal-600',
      'from-cyan-500 to-cyan-600',
      'from-orange-500 to-orange-600',
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  return (
    <div
      className={cn(
        'rounded-full bg-gradient-to-br flex items-center justify-center text-white font-semibold shadow-md ring-2 ring-white',
        sizeClasses[size],
        getAvatarColor(name),
        className
      )}
    >
      {initials}
    </div>
  );
}
