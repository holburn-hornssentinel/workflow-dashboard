'use client';

import { AlertCircle, Zap, Info, X, Focus } from 'lucide-react';
import type { Suggestion } from '@/types/suggestions';
import { useBuilderStore } from '@/stores/builderStore';
import { useSuggestionsStore } from '@/stores/suggestionsStore';

interface SuggestionCardProps {
  suggestion: Suggestion;
}

export function SuggestionCard({ suggestion }: SuggestionCardProps) {
  const { setSelectedNodeId } = useBuilderStore();
  const { dismissSuggestion } = useSuggestionsStore();

  const config = {
    warning: {
      icon: AlertCircle,
      iconColor: 'text-yellow-500',
      borderColor: 'border-yellow-500/30',
      bgColor: 'bg-yellow-500/10',
    },
    optimization: {
      icon: Zap,
      iconColor: 'text-blue-500',
      borderColor: 'border-blue-500/30',
      bgColor: 'bg-blue-500/10',
    },
    quality: {
      icon: Info,
      iconColor: 'text-purple-500',
      borderColor: 'border-purple-500/30',
      bgColor: 'bg-purple-500/10',
    },
  };

  const { icon: Icon, iconColor, borderColor, bgColor } = config[suggestion.type];

  const handleFocus = () => {
    if (suggestion.nodeIds && suggestion.nodeIds.length > 0) {
      setSelectedNodeId(suggestion.nodeIds[0]);
    }
  };

  const handleDismiss = () => {
    dismissSuggestion(suggestion.id);
  };

  return (
    <div
      className={`${bgColor} border ${borderColor} rounded-lg p-4 space-y-3 transition-all hover:shadow-lg`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-white font-semibold text-sm">{suggestion.title}</h3>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-white transition-colors"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-gray-300 text-sm mt-1">{suggestion.description}</p>
        </div>
      </div>

      {suggestion.impact && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-400">Impact:</span>
          <span
            className={`px-2 py-0.5 rounded ${
              suggestion.impact === 'high'
                ? 'bg-red-500/20 text-red-300'
                : suggestion.impact === 'medium'
                  ? 'bg-yellow-500/20 text-yellow-300'
                  : 'bg-blue-500/20 text-blue-300'
            }`}
          >
            {suggestion.impact}
          </span>
        </div>
      )}

      {suggestion.estimatedSpeedup && (
        <div className="text-xs text-green-400">
          ⚡ {suggestion.estimatedSpeedup}
        </div>
      )}

      {suggestion.mitigation && (
        <div className="text-xs text-gray-400 border-t border-gray-700 pt-2 mt-2">
          <span className="font-semibold">Solution:</span> {suggestion.mitigation}
        </div>
      )}

      {suggestion.nodeIds && suggestion.nodeIds.length > 0 && (
        <button
          onClick={handleFocus}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors"
        >
          <Focus className="w-3 h-3" />
          Focus affected node{suggestion.nodeIds.length > 1 ? 's' : ''}
        </button>
      )}
    </div>
  );
}
