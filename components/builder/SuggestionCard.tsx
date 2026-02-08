'use client';

import { AlertCircle, Zap, Info, X, Focus, FileCode } from 'lucide-react';
import type { Suggestion } from '@/types/suggestions';
import type { SecuritySuggestion, SecuritySeverity } from '@/types/security';
import { useBuilderStore } from '@/stores/builderStore';
import { useSuggestionsStore } from '@/stores/suggestionsStore';

interface SuggestionCardProps {
  suggestion: Suggestion;
}

export function SuggestionCard({ suggestion }: SuggestionCardProps) {
  const { setSelectedNodeId, nodes } = useBuilderStore();
  const { dismissSuggestion } = useSuggestionsStore();

  const isSecuritySuggestion = suggestion.type === 'security';
  const securitySuggestion = isSecuritySuggestion ? (suggestion as SecuritySuggestion) : null;

  const getSeverityBadgeStyle = (severity: SecuritySeverity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-600 text-white border-red-700';
      case 'high':
        return 'bg-orange-500 text-white border-orange-600';
      case 'medium':
        return 'bg-amber-500 text-white border-amber-600';
      case 'low':
        return 'bg-yellow-500 text-white border-yellow-600';
      default:
        return 'bg-slate-500 text-white border-slate-600';
    }
  };

  const config: Record<
    import('@/types/suggestions').SuggestionType,
    { icon: any; iconColor: string; borderColor: string; bgColor: string }
  > = {
    security: {
      icon: AlertCircle,
      iconColor: 'text-red-500',
      borderColor: 'border-red-500/30',
      bgColor: 'bg-red-500/10',
    },
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

  const affectedNode = suggestion.nodeIds?.[0] ? nodes.find(n => n.id === suggestion.nodeIds![0]) : null;
  const isPulsing = securitySuggestion?.severity === 'critical';

  return (
    <div
      className={`${bgColor} border ${borderColor} rounded-lg p-4 space-y-3 transition-all hover:shadow-lg ${
        isPulsing ? 'animate-pulse-border' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-white font-semibold text-sm">{suggestion.title}</h3>
              {securitySuggestion && (
                <span
                  className={`text-xs px-2 py-0.5 rounded border font-semibold uppercase ${getSeverityBadgeStyle(
                    securitySuggestion.severity
                  )}`}
                >
                  {securitySuggestion.severity}
                </span>
              )}
              {securitySuggestion?.cwe && (
                <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300 border border-slate-600 font-mono">
                  {securitySuggestion.cwe}
                </span>
              )}
            </div>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-white transition-colors active:scale-[0.98]"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Node Location */}
          {affectedNode && (
            <div className="flex items-center gap-1 text-xs text-slate-400 mb-2">
              <FileCode className="w-3 h-3" />
              <span>Node: {affectedNode.data?.label || affectedNode.id}</span>
            </div>
          )}

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

      {/* Code Snippet for Security Issues */}
      {securitySuggestion && affectedNode?.data?.prompt && (
        <div className="text-xs border-t border-gray-700 pt-2 mt-2">
          <div className="text-gray-400 font-semibold mb-1">Vulnerable Code:</div>
          <div className="bg-black/40 p-2 rounded font-mono text-gray-300 overflow-x-auto">
            <code>{affectedNode.data.prompt.substring(0, 150)}{affectedNode.data.prompt.length > 150 ? '...' : ''}</code>
          </div>
        </div>
      )}

      {suggestion.mitigation && (
        <div className="text-xs text-gray-400 border-t border-gray-700 pt-2 mt-2">
          <span className="font-semibold">Solution:</span> {suggestion.mitigation}
        </div>
      )}

      {securitySuggestion?.remediation && !suggestion.mitigation && (
        <div className="text-xs text-gray-400 border-t border-gray-700 pt-2 mt-2">
          <span className="font-semibold">Fix:</span> {securitySuggestion.remediation}
        </div>
      )}

      {suggestion.nodeIds && suggestion.nodeIds.length > 0 && (
        <button
          onClick={handleFocus}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors active:scale-[0.98]"
        >
          <Focus className="w-3 h-3" />
          Focus affected node{suggestion.nodeIds.length > 1 ? 's' : ''}
        </button>
      )}
    </div>
  );
}
