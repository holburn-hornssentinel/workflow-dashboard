'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import VoiceButton from './VoiceButton';
import { Sparkles, Bot, AlertCircle, Lightbulb } from 'lucide-react';

interface VibeInputProps {
  onGenerate?: (description: string, provider: 'claude' | 'gemini') => Promise<void>;
  placeholder?: string;
}

interface Provider {
  id: 'claude' | 'gemini';
  name: string;
  configured: boolean;
}

export default function VibeInput({
  onGenerate,
  placeholder = 'Describe what you want your workflow to do...',
}: VibeInputProps) {
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<'claude' | 'gemini'>('claude');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const router = useRouter();

  // Fetch available providers on mount
  useEffect(() => {
    async function fetchProviders() {
      try {
        const response = await fetch('/api/providers');
        if (response.ok) {
          const data = await response.json();
          setProviders(data.providers || []);

          // Set default provider to first configured one
          const configured = data.providers.find((p: Provider) => p.configured);
          if (configured) {
            setProvider(configured.id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch providers:', error);
      } finally {
        setLoadingProviders(false);
      }
    }
    fetchProviders();
  }, []);

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError('Please enter a description');
      return;
    }

    // Check if provider is configured
    const selectedProvider = providers.find(p => p.id === provider);
    if (!selectedProvider?.configured) {
      setError('Please configure your API key in Settings → AI Models');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      if (onGenerate) {
        await onGenerate(description, provider);
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

  const handleTranscript = useCallback((text: string) => {
    setDescription((prev) => (prev ? `${prev} ${text}` : text));
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Main Input */}
      <div className="bg-slate-900/95 backdrop-blur border-2 border-white/[0.06] rounded-xl p-4 shadow-2xl">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-white" />
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
          {loadingProviders ? (
            <div className="text-center py-4 text-slate-400 text-sm">
              Checking available providers...
            </div>
          ) : providers.length === 0 || !providers.some(p => p.configured) ? (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-sm text-yellow-400">
              <AlertCircle className="h-4 w-4 inline mr-2" />
              No AI providers configured. Please add your API keys in Settings.
            </div>
          ) : (
            <div className="flex gap-3">
              {providers.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => p.configured && setProvider(p.id)}
                  disabled={!p.configured}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                    !p.configured
                      ? 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                      : provider === p.id
                      ? p.id === 'claude'
                        ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                        : 'bg-blue-600 text-white ring-2 ring-blue-400'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {p.id === 'claude' ? (
                    <Bot className="h-4 w-4" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {p.id === 'claude' ? 'Claude Sonnet 4.5' : 'Gemini 2.5 Flash'}
                  {!p.configured && (
                    <span className="text-xs ml-1">(not configured)</span>
                  )}
                </button>
              ))}
            </div>
          )}
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
            <VoiceButton onTranscript={handleTranscript} />
          </div>
        </div>

        {error && (
          <div className="mt-3 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
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
              px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2
              ${
                isGenerating || !description.trim()
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20'
              }
            `}
          >
            {isGenerating ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Workflow
              </>
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
              className="w-full text-left px-4 py-3 bg-slate-800/50 hover:bg-slate-800 border border-white/[0.06] hover:border-slate-600 rounded-lg text-sm text-slate-300 transition-all flex items-start gap-2"
            >
              <Lightbulb className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
