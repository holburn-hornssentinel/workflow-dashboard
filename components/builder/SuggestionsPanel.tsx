'use client';

import { ChevronRight, ChevronLeft, RefreshCw, Award, Shield } from 'lucide-react';
import { useSuggestionsStore } from '@/stores/suggestionsStore';
import { SuggestionCard } from './SuggestionCard';
import type { SecuritySuggestion } from '@/types/security';

export function SuggestionsPanel() {
  const { suggestions, workflowScore, securityScore, isAnalyzing, isOpen, toggleOpen } =
    useSuggestionsStore();

  const suggestionsByType = {
    security: suggestions.filter((s) => s.type === 'security') as SecuritySuggestion[],
    optimization: suggestions.filter((s) => s.type === 'optimization'),
    warning: suggestions.filter((s) => s.type === 'warning'),
    quality: suggestions.filter((s) => s.type === 'quality'),
  };

  const criticalSecurityIssues = suggestionsByType.security.filter(
    (s) => s.severity === 'critical'
  ).length;

  const highRiskIssues = suggestionsByType.security.filter(
    (s) => s.severity === 'high'
  ).length;

  const mediumRiskIssues = suggestionsByType.security.filter(
    (s) => s.severity === 'medium'
  ).length;

  const totalIssues = suggestions.length;
  const testsPassed = Math.max(0, 42 - totalIssues); // Mock calculation, can be enhanced

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

            {/* Security Statistics Dashboard */}
            {suggestionsByType.security.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {/* Critical Issues */}
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                  <div className="text-red-400 text-xs font-semibold mb-1">Critical</div>
                  <div className="text-2xl font-bold text-red-400">{criticalSecurityIssues}</div>
                </div>

                {/* High Risk */}
                <div className="bg-orange-500/10 border border-orange-500/50 rounded-lg p-3">
                  <div className="text-orange-400 text-xs font-semibold mb-1">High Risk</div>
                  <div className="text-2xl font-bold text-orange-400">{highRiskIssues}</div>
                </div>

                {/* Tests Passed */}
                <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-3">
                  <div className="text-green-400 text-xs font-semibold mb-1">Passed</div>
                  <div className="text-2xl font-bold text-green-400">{testsPassed}</div>
                </div>
              </div>
            )}

            {/* Security Score */}
            {securityScore !== undefined && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400 flex items-center gap-1">
                    <Shield className="w-4 h-4" />
                    Security Score
                  </span>
                  <span
                    className={`text-lg font-bold ${
                      securityScore >= 80
                        ? 'text-green-400'
                        : securityScore >= 60
                          ? 'text-yellow-400'
                          : 'text-red-400'
                    }`}
                  >
                    {securityScore}/100
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      securityScore >= 80
                        ? 'bg-green-500'
                        : securityScore >= 60
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    }`}
                    style={{ width: `${securityScore}%` }}
                  />
                </div>
                {criticalSecurityIssues > 0 && (
                  <div className="mt-2 text-xs text-red-400 flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    {criticalSecurityIssues} critical issue
                    {criticalSecurityIssues > 1 ? 's' : ''} found
                  </div>
                )}
              </div>
            )}

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
              {/* Security Issues */}
              {suggestionsByType.security.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wide flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Security ({suggestionsByType.security.length})
                  </h3>
                  {suggestionsByType.security.map((suggestion) => (
                    <SuggestionCard key={suggestion.id} suggestion={suggestion} />
                  ))}
                </div>
              )}

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
