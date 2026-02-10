'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BudgetDashboard } from '@/components/router/BudgetDashboard';
import { ModelRoutingPanel } from '@/components/router/ModelRoutingPanel';
import { SpendingChart } from '@/components/router/SpendingChart';
import { BudgetConfig } from '@/components/router/BudgetConfig';
import { Tabs, Tab } from '@/components/ui/Tabs';
import { Settings as SettingsIcon, RefreshCw, DollarSign, Bot, Shield, Zap } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { markChecklistComplete } from '@/components/walkthrough/ProgressChecklist';
import { useToastStore } from '@/stores/toastStore';
import { useApiKeyStore } from '@/stores/apiKeyStore';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface EnvConfig {
  anthropicKey: string;
  geminiKey: string;
  hasAnthropicKey: boolean;
  hasGeminiKey: boolean;
  memoryBackend: string;
  lancedbPath: string;
  authMode: 'open' | 'api-key' | 'dev-bypass';
  demoMode: boolean;
}

export default function SettingsPage() {
  const toast = useToastStore();
  const apiKeyStore = useApiKeyStore();

  const [config, setConfig] = useState<EnvConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<{ provider: 'claude' | 'gemini' | null }>({ provider: null });
  const [restarting, setRestarting] = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);

  // Form state
  const [anthropicKey, setAnthropicKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [memoryBackend, setMemoryBackend] = useState('local');
  const [lancedbPath, setLancedbPath] = useState('./data/lancedb');
  const [dashboardApiKey, setDashboardApiKey] = useState('');

  // Load current config
  useEffect(() => {
    loadConfig();
    // Mark settings as visited for walkthrough checklist
    markChecklistComplete('settings');
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/settings/env');
      const data = await response.json();
      setConfig(data);
      setAnthropicKey(data.anthropicKey);
      setGeminiKey(data.geminiKey);
      setMemoryBackend(data.memoryBackend);
      setLancedbPath(data.lancedbPath);
    } catch (error) {
      console.error('Failed to load config:', error);
      toast.error('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };

      // Add X-API-Key header if dashboard API key is set
      if (dashboardApiKey) {
        headers['X-API-Key'] = dashboardApiKey;
      }

      const response = await fetch('/api/settings/env', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          anthropicKey,
          geminiKey,
          memoryBackend,
          lancedbPath,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        await loadConfig(); // Reload to show updated masked keys
        await apiKeyStore.refreshStatus(); // Refresh API key status
      } else {
        toast.error(data.error || 'Failed to save configuration');
      }
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async (provider: 'claude' | 'gemini') => {
    setTesting({ provider });

    try {
      const response = await fetch('/api/vibe/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: 'test connection',
          provider,
        }),
      });

      if (response.ok) {
        toast.success(`${provider === 'claude' ? 'Claude' : 'Gemini'} connection successful!`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Connection failed');
      }
    } catch (error) {
      console.error('Test failed:', error);
      toast.error('Connection test failed');
    } finally {
      setTesting({ provider: null });
    }
  };

  const handleRestart = async () => {
    setShowRestartConfirm(false);
    setRestarting(true);
    toast.success('Restarting server...');

    try {
      const headers: HeadersInit = {};

      // Add X-API-Key header if dashboard API key is set
      if (dashboardApiKey) {
        headers['X-API-Key'] = dashboardApiKey;
      }

      await fetch('/api/settings/restart', {
        method: 'POST',
        headers,
      });

      // Wait for server to restart and reload page
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (error) {
      console.error('Restart failed:', error);
      toast.error('Restart failed. Please restart manually.');
      setRestarting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading configuration..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/"
            className="text-slate-400 hover:text-white transition-colors mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-lg font-medium tracking-tight text-white mb-2 flex items-center gap-2">
            <SettingsIcon className="h-6 w-6" /> Settings
          </h1>
          <p className="text-slate-300">Configure AI providers and system settings</p>
        </div>

        {/* Tabbed Interface */}
        <Tabs
          tabs={[
            {
              id: 'budget',
              label: 'Budget & Usage',
              icon: <DollarSign className="h-4 w-4" />,
              content: (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-6">
                    <SpendingChart />
                    <BudgetConfig />
                  </div>
                  <div>
                    <BudgetDashboard />
                  </div>
                </div>
              ),
            },
            {
              id: 'models',
              label: 'AI Models',
              icon: <Bot className="h-4 w-4" />,
              content: (
                <div className="space-y-6">
                  {/* AI Providers Section */}
                  <div className="bg-slate-800/50 backdrop-blur border border-white/[0.06] rounded-xl p-4">
                    <h2 className="text-lg font-medium text-white mb-4">AI Providers</h2>
                    <p className="text-slate-400 mb-6">Configure at least one AI provider to use workflow generation features.</p>

                    {/* Claude API Key */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-white font-medium flex items-center gap-2">
                          Anthropic Claude API Key
                          {config?.hasAnthropicKey && (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                              ✓ Configured
                            </span>
                          )}
                        </label>
                        {config?.hasAnthropicKey && (
                          <button
                            onClick={() => testConnection('claude')}
                            disabled={testing.provider === 'claude'}
                            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white text-sm rounded transition-colors"
                          >
                            {testing.provider === 'claude' ? 'Testing...' : 'Test Connection'}
                          </button>
                        )}
                      </div>
                      <input
                        type="password"
                        value={anthropicKey}
                        onChange={(e) => setAnthropicKey(e.target.value)}
                        placeholder="sk-ant-..."
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                      />
                      <p className="text-slate-500 text-sm mt-1">
                        Get your key from:{' '}
                        <a
                          href="https://console.anthropic.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-400 hover:underline"
                        >
                          console.anthropic.com
                        </a>
                      </p>
                    </div>

                    {/* Gemini API Key */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-white font-medium flex items-center gap-2">
                          Google Gemini API Key
                          {config?.hasGeminiKey && (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                              ✓ Configured
                            </span>
                          )}
                        </label>
                        {config?.hasGeminiKey && (
                          <button
                            onClick={() => testConnection('gemini')}
                            disabled={testing.provider === 'gemini'}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white text-sm rounded transition-colors"
                          >
                            {testing.provider === 'gemini' ? 'Testing...' : 'Test Connection'}
                          </button>
                        )}
                      </div>
                      <input
                        type="password"
                        value={geminiKey}
                        onChange={(e) => setGeminiKey(e.target.value)}
                        placeholder="AIza..."
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                      <p className="text-slate-500 text-sm mt-1">
                        Get your key from:{' '}
                        <a
                          href="https://aistudio.google.com/app/apikey"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline"
                        >
                          aistudio.google.com
                        </a>
                      </p>
                    </div>
                  </div>

                  {/* Model Routing Rules Section */}
                  <div className="bg-slate-800/50 backdrop-blur border border-white/[0.06] rounded-xl p-4">
                    <h2 className="text-lg font-medium text-white mb-4">Model Routing Rules</h2>
                    <p className="text-slate-400 mb-6">Configure which models to use for different task types.</p>
                    <ModelRoutingPanel />
                  </div>
                </div>
              ),
            },
            {
              id: 'security',
              label: 'Security',
              icon: <Shield className="h-4 w-4" />,
              content: (
                <div className="space-y-6">
                  {/* Authentication Configuration */}
                  <div className="bg-slate-800/50 backdrop-blur border border-white/[0.06] rounded-xl p-4">
                    <h2 className="text-lg font-medium text-white mb-4">Authentication</h2>
                    <p className="text-slate-400 mb-6">Configure how the dashboard protects sensitive endpoints.</p>

                    {/* Auth Mode Display */}
                    <div className="mb-6">
                      <label className="text-white font-medium block mb-2">Current Auth Mode</label>
                      <div className="px-4 py-3 bg-slate-900 border border-slate-600 rounded text-white">
                        <span className="font-mono">{config?.authMode || 'dev-bypass'}</span>
                        <span className="ml-3 text-slate-400">
                          {config?.authMode === 'open' && '(No auth required)'}
                          {config?.authMode === 'api-key' && '(API key required)'}
                          {config?.authMode === 'dev-bypass' && '(Skip auth in dev)'}
                        </span>
                      </div>
                      <p className="text-slate-500 text-sm mt-2">
                        Set AUTH_MODE in .env.local to change this setting.
                      </p>
                    </div>

                    {/* Dashboard API Key */}
                    <div className="mb-6">
                      <label className="text-white font-medium block mb-2">Dashboard API Key</label>
                      <input
                        type="password"
                        value={dashboardApiKey}
                        onChange={(e) => setDashboardApiKey(e.target.value)}
                        placeholder="Enter your DASHBOARD_API_KEY"
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                      />
                      <p className="text-slate-500 text-sm mt-2">
                        Required when AUTH_MODE=api-key. Enter the key here to authenticate save operations.
                      </p>
                    </div>

                    {/* Info Box */}
                    <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <p className="text-blue-300 text-sm">
                        <strong>Auth Modes:</strong>
                        <br />
                        • <span className="font-mono">open</span> - No auth required (local dev, trusted networks)
                        <br />
                        • <span className="font-mono">api-key</span> - Require DASHBOARD_API_KEY (production)
                        <br />
                        • <span className="font-mono">dev-bypass</span> - Skip auth in development (default)
                      </p>
                    </div>
                  </div>

                  {/* Demo Mode Display */}
                  <div className="bg-slate-800/50 backdrop-blur border border-white/[0.06] rounded-xl p-4">
                    <h2 className="text-lg font-medium text-white mb-4">Demo Mode</h2>
                    <p className="text-slate-400 mb-6">Blocks dangerous MCP operations for public demos.</p>

                    <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-600 rounded">
                      <div>
                        <p className="text-white font-medium">Demo Mode</p>
                        <p className="text-slate-400 text-sm">
                          Current status: <span className={config?.demoMode ? 'text-yellow-400' : 'text-green-400'}>
                            {config?.demoMode ? 'Enabled' : 'Disabled'}
                          </span>
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded ${config?.demoMode ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>
                        {config?.demoMode ? 'ON' : 'OFF'}
                      </div>
                    </div>

                    <p className="text-slate-500 text-sm mt-4">
                      Set DEMO_MODE=true in .env.local to enable. Blocks file deletion, git push, and shell execution.
                    </p>
                  </div>
                </div>
              ),
            },
            {
              id: 'performance',
              label: 'Performance',
              icon: <Zap className="h-4 w-4" />,
              content: (
                <div className="bg-slate-800/50 backdrop-blur border border-white/[0.06] rounded-xl p-4">
                  <h2 className="text-lg font-medium text-white mb-4">Memory Settings</h2>
                  <p className="text-slate-400 mb-6">Configure persistent memory storage for AI agents.</p>

                  {/* Memory Backend */}
                  <div className="mb-6">
                    <label className="text-white font-medium block mb-2">Memory Backend</label>
                    <select
                      value={memoryBackend}
                      onChange={(e) => setMemoryBackend(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded text-white focus:outline-none focus:border-pink-500"
                    >
                      <option value="local">Local (LanceDB)</option>
                      <option value="cloud">Cloud (Pinecone)</option>
                    </select>
                    <p className="text-slate-500 text-sm mt-1">
                      Local storage works offline, cloud storage requires Pinecone API key.
                    </p>
                  </div>

                  {/* LanceDB Path (only for local) */}
                  {memoryBackend === 'local' && (
                    <div className="mb-6">
                      <label className="text-white font-medium block mb-2">LanceDB Path</label>
                      <input
                        type="text"
                        value={lancedbPath}
                        onChange={(e) => setLancedbPath(e.target.value)}
                        placeholder="./data/lancedb"
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                      />
                      <p className="text-slate-500 text-sm mt-1">
                        Directory where vector embeddings will be stored.
                      </p>
                    </div>
                  )}
                </div>
              ),
            },
          ]}
          defaultTab="budget"
        />

        {/* Confirm Dialog */}
        <ConfirmDialog
          isOpen={showRestartConfirm}
          title="Restart Server"
          message="Restart the development server? The page will reload automatically."
          confirmLabel="Restart"
          cancelLabel="Cancel"
          variant="warning"
          onConfirm={handleRestart}
          onCancel={() => setShowRestartConfirm(false)}
        />

        {/* Save Button */}
        <div className="flex justify-between items-center gap-4">
          <button
            onClick={() => setShowRestartConfirm(true)}
            disabled={restarting}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors active:scale-[0.98] flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" /> {restarting ? 'Restarting...' : 'Restart Server'}
          </button>
          <div className="flex gap-4">
            <Link
              href="/"
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
            >
              Cancel
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors active:scale-[0.98]"
            >
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
          <p className="text-blue-300 text-sm">
            <strong>Note:</strong> After saving, click the "Restart Server" button above to apply changes.
          </p>
        </div>
      </div>
    </div>
  );
}
