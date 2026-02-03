'use client';

import { ChevronRight, ChevronLeft, RefreshCw, Award } from 'lucide-react';
import { useSuggestionsStore } from '@/stores/suggestionsStore';
import { SuggestionCard } from './SuggestionCard';

export function SuggestionsPanel() {
  const { suggestions, workflowScore, isAnalyzing, isOpen, toggleOpen } =
    useSuggestionsStore();

  const suggestionsByType = {
    optimization: suggestions.filter((s) => s.type === 'optimization'),
    warning: suggestions.filter((s) => s.type === 'warning'),
    quality: suggestions.filter((s) => s.type === 'quality'),
  };

  return (
    <div
      className={`bg-slate-900/95 backdrop-blur border-l border-slate-700 transition-all duration-300 ${
        isOpen ? 'w-80' : 'w-12'
      }`}
    >
      {/* Toggle Button */}
      <button
        onClick={toggleOpen}
        className="w-full h-12 flex items-center justify-center bg-slate-800/50 hover:bg-slate-700/50 transition-colors border-b border-slate-700"
        title={isOpen ? 'Collapse suggestions' : 'Expand suggestions'}
      >
        {isOpen ? (
          <ChevronRight className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronLeft className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {isOpen && (
        <div className="p-4 space-y-4 h-[calc(100vh-3rem)] overflow-y-auto">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5" />
                AI Suggestions
              </h2>
              {isAnalyzing && (
                <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
              )}
            </div>

            {/* Workflow Score */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Workflow Score</span>
                <span
                  className={`text-lg font-bold ${
                    workflowScore >= 80
                      ? 'text-green-400'
                      : workflowScore >= 60
                        ? 'text-yellow-400'
                        : 'text-red-400'
                  }`}
                >
                  {workflowScore}/100
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    workflowScore >= 80
                      ? 'bg-green-500'
                      : workflowScore >= 60
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${workflowScore}%` }}
                />
              </div>
            </div>
          </div>

          {/* Suggestions */}
          {suggestions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Award className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No suggestions yet</p>
              <p className="text-xs mt-1">Add nodes to get AI-powered recommendations</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Optimizations */}
              {suggestionsByType.optimization.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wide">
                    Optimizations ({suggestionsByType.optimization.length})
                  </h3>
                  {suggestionsByType.optimization.map((suggestion) => (
                    <SuggestionCard key={suggestion.id} suggestion={suggestion} />
                  ))}
                </div>
              )}

              {/* Warnings */}
              {suggestionsByType.warning.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-yellow-400 uppercase tracking-wide">
                    Warnings ({suggestionsByType.warning.length})
                  </h3>
                  {suggestionsByType.warning.map((suggestion) => (
                    <SuggestionCard key={suggestion.id} suggestion={suggestion} />
                  ))}
                </div>
              )}

              {/* Quality Improvements */}
              {suggestionsByType.quality.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-purple-400 uppercase tracking-wide">
                    Quality ({suggestionsByType.quality.length})
                  </h3>
                  {suggestionsByType.quality.map((suggestion) => (
                    <SuggestionCard key={suggestion.id} suggestion={suggestion} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
