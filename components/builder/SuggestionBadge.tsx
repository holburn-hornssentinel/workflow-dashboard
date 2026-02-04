'use client';

import { AlertCircle, Zap, Info, Shield } from 'lucide-react';
import type { SuggestionType } from '@/types/suggestions';

interface SuggestionBadgeProps {
  count: number;
  type?: SuggestionType;
}

export function SuggestionBadge({ count, type = 'warning' }: SuggestionBadgeProps) {
  if (count === 0) return null;

  const config: Record<
    SuggestionType,
    { icon: typeof Shield; bg: string; text: string }
  > = {
    security: {
      icon: Shield,
      bg: 'bg-red-500',
      text: 'text-red-900',
    },
    warning: {
      icon: AlertCircle,
      bg: 'bg-yellow-500',
      text: 'text-yellow-900',
    },
    optimization: {
      icon: Zap,
      bg: 'bg-blue-500',
      text: 'text-blue-900',
    },
    quality: {
      icon: Info,
      bg: 'bg-purple-500',
      text: 'text-purple-900',
    },
  };

  const { icon: Icon, bg, text } = config[type];

  return (
    <div
      className={`absolute -top-2 -right-2 ${bg} ${text} rounded-full px-2 py-0.5 text-xs font-bold flex items-center gap-1 shadow-lg z-10`}
    >
      <Icon className="w-3 h-3" />
      {count}
    </div>
  );
}
