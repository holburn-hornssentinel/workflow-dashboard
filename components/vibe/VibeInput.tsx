'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import VoiceButton from './VoiceButton';

interface VibeInputProps {
  onGenerate?: (description: string) => Promise<void>;
  placeholder?: string;
}

export default function VibeInput({
  onGenerate,
  placeholder = 'Describe what you want your workflow to do...',
}: VibeInputProps) {
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<'claude' | 'gemini'>('claude');
  const router = useRouter();

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError('Please enter a description');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      if (onGenerate) {
        await onGenerate(description);
      } else {
        // Default: call API and redirect to builder
        const response = await fetch('/api/vibe/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description, provider }),
        });

        const data = await response.json();

        if (!response.ok) {
          // Show actual API error message instead of generic one
          throw new Error(data.error || 'Failed to generate workflow');
        }

        // Store workflow data and redirect to builder
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('vibeWorkflow', JSON.stringify(data));
          router.push('/builder');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleGenerate();
    }
  };

  const examples = [
    'Every morning at 9am, check my GitHub notifications and summarize important ones',
    'When I upload a PDF document, extract key points and create a summary',
    'Review my code changes and create a detailed pull request description',
    'Monitor my website every hour and alert me if it goes down',
    'Process incoming emails and categorize them by urgency',
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Main Input */}
      <div className="bg-slate-900/95 backdrop-blur border-2 border-white/[0.06] rounded-xl p-4 shadow-2xl">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-2xl">
            ✨
          </div>
          <div className="flex-1">
            <h3 className="text-base font-medium text-white mb-2">
              Describe Your Workflow
            </h3>
            <p className="text-slate-400 text-sm">
              Tell me what you want to accomplish, and I'll create an AI workflow for
              you
            </p>
          </div>
        </div>

        {/* AI Provider Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            AI Provider
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setProvider('claude')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                provider === 'claude'
                  ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              🤖 Claude Sonnet 4.5
            </button>
            <button
              type="button"
              onClick={() => setProvider('gemini')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                provider === 'gemini'
                  ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              ✨ Gemini 2.5 Flash
            </button>
          </div>
        </div>

        <div className="relative">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full bg-slate-800 text-white px-4 py-3 pr-14 rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500 resize-none transition-colors"
            rows={6}
          />
          <div className="absolute bottom-3 right-3">
            <VoiceButton
              onTranscript={(text) => {
                setDescription((prev) =>
                  prev ? `${prev} ${text}` : text
                );
              }}
            />
          </div>
        </div>

        {error && (
          <div className="mt-3 text-red-400 text-sm flex items-center gap-2">
            <span>⚠️</span>
            {error}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Press <kbd className="px-2 py-1 bg-slate-800 rounded">Ctrl+Enter</kbd> to
            generate
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !description.trim()}
            className={`
              px-4 py-2 rounded-lg font-semibold transition-all
              ${
                isGenerating || !description.trim()
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20'
              }
            `}
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Generating...
              </span>
            ) : (
              '✨ Generate Workflow'
            )}
          </button>
        </div>
      </div>

      {/* Example Prompts */}
      <div className="mt-6">
        <p className="text-sm text-slate-400 mb-3">Try these examples:</p>
        <div className="space-y-2">
          {examples.map((example, idx) => (
            <button
              key={idx}
              onClick={() => setDescription(example)}
              className="w-full text-left px-4 py-3 bg-slate-800/50 hover:bg-slate-800 border border-white/[0.06] hover:border-slate-600 rounded-lg text-sm text-slate-300 transition-all"
            >
              <span className="text-blue-400 mr-2">💡</span>
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
