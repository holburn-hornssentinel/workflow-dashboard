'use client';

import { useState } from 'react';

const MODELS = [
  {
    id: 'claude-opus',
    name: 'Claude Opus 4.5',
    provider: 'Anthropic',
    cost: '$$$',
    bestFor: ['Critical production code', 'Complex algorithms', 'Architecture decisions'],
    colorCard: 'bg-gradient-to-r from-purple-500/10 to-purple-600/10 border border-purple-500/30',
    colorText: 'text-purple-400',
    colorButton: 'bg-purple-500/20 border-2 border-purple-500',
  },
  {
    id: 'claude-sonnet',
    name: 'Claude Sonnet 4.5',
    provider: 'Anthropic',
    cost: '$$',
    bestFor: ['Refactoring', 'Security reviews', 'Complex features'],
    colorCard: 'bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/30',
    colorText: 'text-blue-400',
    colorButton: 'bg-blue-500/20 border-2 border-blue-500',
  },
  {
    id: 'claude-haiku',
    name: 'Claude Haiku 4.5',
    provider: 'Anthropic',
    cost: '$',
    bestFor: ['Fast responses', 'Simple tasks', 'Quick fixes'],
    colorCard: 'bg-gradient-to-r from-cyan-500/10 to-cyan-600/10 border border-cyan-500/30',
    colorText: 'text-cyan-400',
    colorButton: 'bg-cyan-500/20 border-2 border-cyan-500',
  },
  {
    id: 'gemini-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    cost: '$$',
    bestFor: ['Large codebase analysis', '1M context window', 'Complex reasoning'],
    colorCard: 'bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/30',
    colorText: 'text-green-400',
    colorButton: 'bg-green-500/20 border-2 border-green-500',
  },
  {
    id: 'gemini-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    cost: '$',
    bestFor: ['Test generation', 'Documentation', 'Routine work', 'BEST VALUE'],
    colorCard: 'bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 border border-emerald-500/30',
    colorText: 'text-emerald-400',
    colorButton: 'bg-emerald-500/20 border-2 border-emerald-500',
    recommended: true,
  },
  {
    id: 'gemini-flash-lite',
    name: 'Gemini Flash Lite',
    provider: 'Google',
    cost: '¢',
    bestFor: ['Maximum cost savings', 'Simple tasks', 'Bulk operations'],
    colorCard: 'bg-gradient-to-r from-lime-500/10 to-lime-600/10 border border-lime-500/30',
    colorText: 'text-lime-400',
    colorButton: 'bg-lime-500/20 border-2 border-lime-500',
  },
];

interface ModelSelectorProps {
  selectedModel: string;
  onChange: (modelId: string) => void;
  recommendation?: string;
}

export default function ModelSelector({ selectedModel, onChange, recommendation }: ModelSelectorProps) {
  const [showDetails, setShowDetails] = useState(false);

  const selected = MODELS.find(m => m.id === selectedModel) || MODELS[4]; // Default to Gemini Flash
  const recommended = MODELS.find(m => m.id === recommendation);

  return (
    <div className="space-y-3">
      {/* Current Selection */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-300">AI Model:</label>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-blue-400 hover:text-blue-300"
        >
          {showDetails ? 'Hide details' : 'Show all models'}
        </button>
      </div>

      {/* Recommended Model Alert */}
      {recommended && recommended.id !== selectedModel && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <span className="text-yellow-400 text-lg">💡</span>
            <div>
              <div className="text-yellow-400 text-sm font-medium mb-1">
                Expert Recommendation
              </div>
              <div className="text-yellow-200 text-xs mb-2">
                {recommended.name} is recommended for this step
              </div>
              <button
                onClick={() => onChange(recommended.id)}
                className="text-xs bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 px-3 py-1 rounded transition-colors"
              >
                Use Recommended Model
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Model Card */}
      <div className={`${selected.colorCard} rounded-lg p-4`}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-white font-semibold">{selected.name}</div>
            <div className="text-slate-400 text-xs">{selected.provider}</div>
          </div>
          <div className={`${selected.colorText} font-bold text-lg`}>{selected.cost}</div>
        </div>
        <div className="text-slate-300 text-xs">
          <span className="font-medium">Best for:</span> {selected.bestFor.join(', ')}
        </div>
        {selected.recommended && (
          <div className="mt-2 inline-block bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded">
            ⭐ Best Value
          </div>
        )}
      </div>

      {/* All Models Grid */}
      {showDetails && (
        <div className="grid grid-cols-2 gap-2 pt-2">
          {MODELS.map((model) => (
            <button
              key={model.id}
              onClick={() => onChange(model.id)}
              className={`text-left p-3 rounded-lg transition-all ${
                model.id === selectedModel
                  ? model.colorButton
                  : 'bg-slate-800/50 border border-white/[0.06] hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="text-white text-sm font-medium truncate">{model.name.split(' ')[0]}</div>
                <div className="text-xs font-bold text-slate-400">{model.cost}</div>
              </div>
              <div className="text-xs text-slate-500 truncate">{model.bestFor[0]}</div>
              {model.id === recommendation && (
                <div className="mt-1 text-xs text-yellow-400">✨ Recommended</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
