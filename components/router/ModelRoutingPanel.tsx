'use client';

import { useState } from 'react';
import { Plus, Trash2, Settings, Save } from 'lucide-react';
import { useRouterStore } from '@/stores/routerStore';
import type { RoutingRule } from '@/lib/ai/router';
import type { AllowedModel } from '@/lib/security/sanitizer';
import { ALLOWED_MODELS } from '@/lib/security/sanitizer';

export function ModelRoutingPanel() {
  const { config, addRoutingRule, removeRoutingRule, updateBudget } =
    useRouterStore();

  const [budgetLimit, setBudgetLimit] = useState(config.budgetLimit);
  const [budgetPeriod, setBudgetPeriod] = useState<'day' | 'week' | 'month'>(
    config.budgetPeriod
  );
  const [isAddingRule, setIsAddingRule] = useState(false);

  // New rule form state
  const [newRule, setNewRule] = useState<Partial<RoutingRule>>({
    taskType: '',
    preferredModel: 'claude-sonnet-4-5-20250929',
  });

  const handleSaveBudget = () => {
    updateBudget(budgetLimit, budgetPeriod);
    alert('Budget settings saved');
  };

  const handleAddRule = () => {
    if (!newRule.taskType || !newRule.preferredModel) {
      alert('Please fill in all required fields');
      return;
    }

    const rule: RoutingRule = {
      id: `rule-${Date.now()}`,
      taskType: newRule.taskType,
      preferredModel: newRule.preferredModel as AllowedModel,
      fallbackModel: newRule.fallbackModel as AllowedModel | undefined,
    };

    addRoutingRule(rule);
    setNewRule({ taskType: '', preferredModel: 'claude-sonnet-4-5-20250929' });
    setIsAddingRule(false);
  };

  const handleRemoveRule = (ruleId: string) => {
    if (confirm('Are you sure you want to remove this routing rule?')) {
      removeRoutingRule(ruleId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6" />
          Model Routing Configuration
        </h2>
      </div>

      {/* Budget Settings */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Budget Settings
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Budget Limit ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={budgetLimit}
              onChange={(e) => setBudgetLimit(parseFloat(e.target.value))}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Budget Period
            </label>
            <select
              value={budgetPeriod}
              onChange={(e) =>
                setBudgetPeriod(e.target.value as 'day' | 'week' | 'month')
              }
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
            </select>
          </div>

          <button
            onClick={handleSaveBudget}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Budget Settings
          </button>
        </div>
      </div>

      {/* Routing Rules */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Routing Rules</h3>
          <button
            onClick={() => setIsAddingRule(true)}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Rule
          </button>
        </div>

        {/* Rules List */}
        <div className="space-y-3">
          {config.rules.map((rule) => (
            <div
              key={rule.id}
              className="p-4 bg-slate-700/30 border border-slate-600 rounded-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded">
                      {rule.taskType}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-300">
                      <span className="font-semibold">Primary:</span>{' '}
                      {rule.preferredModel}
                    </p>
                    {rule.fallbackModel && (
                      <p className="text-gray-300">
                        <span className="font-semibold">Fallback:</span>{' '}
                        {rule.fallbackModel}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveRule(rule.id)}
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {config.rules.length === 0 && !isAddingRule && (
            <p className="text-center py-8 text-gray-400">
              No routing rules configured. Add a rule to get started.
            </p>
          )}
        </div>

        {/* Add Rule Form */}
        {isAddingRule && (
          <div className="mt-4 p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
            <h4 className="text-sm font-semibold text-white mb-3">
              New Routing Rule
            </h4>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Task Type
                </label>
                <input
                  type="text"
                  value={newRule.taskType || ''}
                  onChange={(e) =>
                    setNewRule({ ...newRule, taskType: e.target.value })
                  }
                  placeholder="e.g., reasoning, coding, formatting"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Preferred Model
                </label>
                <select
                  value={newRule.preferredModel}
                  onChange={(e) =>
                    setNewRule({
                      ...newRule,
                      preferredModel: e.target.value as AllowedModel,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {ALLOWED_MODELS.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Fallback Model (Optional)
                </label>
                <select
                  value={newRule.fallbackModel || ''}
                  onChange={(e) =>
                    setNewRule({
                      ...newRule,
                      fallbackModel: e.target.value
                        ? (e.target.value as AllowedModel)
                        : undefined,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">None</option>
                  {ALLOWED_MODELS.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleAddRule}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                >
                  Add Rule
                </button>
                <button
                  onClick={() => {
                    setIsAddingRule(false);
                    setNewRule({
                      taskType: '',
                      preferredModel: 'claude-sonnet-4-5-20250929',
                    });
                  }}
                  className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Model Capabilities Reference */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Model Capabilities Reference
        </h3>

        <div className="space-y-3 text-sm">
          <div className="p-3 bg-slate-700/30 rounded-lg">
            <p className="font-semibold text-blue-400">
              claude-opus-4-5-20251101
            </p>
            <p className="text-gray-300 mt-1">
              Best for: Complex reasoning, advanced coding, research
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Cost: $15 input / $75 output per 1M tokens
            </p>
          </div>

          <div className="p-3 bg-slate-700/30 rounded-lg">
            <p className="font-semibold text-green-400">
              claude-sonnet-4-5-20250929
            </p>
            <p className="text-gray-300 mt-1">
              Best for: General coding, analysis, balanced tasks
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Cost: $3 input / $15 output per 1M tokens
            </p>
          </div>

          <div className="p-3 bg-slate-700/30 rounded-lg">
            <p className="font-semibold text-purple-400">gemini-2.5-pro</p>
            <p className="text-gray-300 mt-1">
              Best for: Multimodal tasks, data analysis, balanced performance
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Cost: $1.25 input / $5 output per 1M tokens
            </p>
          </div>

          <div className="p-3 bg-slate-700/30 rounded-lg">
            <p className="font-semibold text-yellow-400">gemini-2.5-flash</p>
            <p className="text-gray-300 mt-1">
              Best for: Fast responses, simple tasks, high throughput
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Cost: $0.075 input / $0.3 output per 1M tokens
            </p>
          </div>

          <div className="p-3 bg-slate-700/30 rounded-lg">
            <p className="font-semibold text-gray-400">ollama/llama3.1</p>
            <p className="text-gray-300 mt-1">
              Best for: Local/offline use, no cost, basic tasks
            </p>
            <p className="text-gray-400 text-xs mt-1">Cost: Free (local)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
