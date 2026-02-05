'use client';

import { useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Download,
  Upload,
  RefreshCw,
} from 'lucide-react';
import { useRouterStore } from '@/stores/routerStore';

export function BudgetDashboard() {
  const {
    budgetStatus,
    usageHistory,
    config,
    updateBudget,
    refreshBudgetStatus,
    exportUsageData,
    importUsageData,
    isLoading,
  } = useRouterStore();

  useEffect(() => {
    refreshBudgetStatus();
  }, [refreshBudgetStatus]);

  const handleExport = () => {
    const data = exportUsageData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usage-data-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result as string;
        importUsageData(data);
        alert('Usage data imported successfully');
      } catch (error) {
        alert('Failed to import data: ' + (error as Error).message);
      }
    };
    reader.readAsText(file);
  };

  const getStatusColor = () => {
    if (budgetStatus.percentUsed >= 100) return 'text-red-400';
    if (budgetStatus.percentUsed >= 80) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getBarColor = () => {
    if (budgetStatus.percentUsed >= 100) return 'bg-red-500';
    if (budgetStatus.percentUsed >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Calculate model breakdown
  const modelBreakdown = usageHistory.reduce(
    (acc, record) => {
      if (!acc[record.model]) {
        acc[record.model] = { cost: 0, count: 0 };
      }
      acc[record.model].cost += record.cost;
      acc[record.model].count += 1;
      return acc;
    },
    {} as Record<string, { cost: number; count: number }>
  );

  const sortedModels = Object.entries(modelBreakdown).sort(
    ([, a], [, b]) => b.cost - a.cost
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <DollarSign className="w-6 h-6" />
          Budget Dashboard
        </h2>
        <div className="flex gap-2">
          <button
            onClick={refreshBudgetStatus}
            disabled={isLoading}
            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <label className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            Import
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Budget Status Card */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-400">Current Period</p>
            <p className="text-2xl font-bold text-white capitalize">
              {config.budgetPeriod === 'day' ? 'Daily' : config.budgetPeriod === 'week' ? 'Weekly' : 'Monthly'} Budget
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Spent / Limit</p>
            <p className={`text-2xl font-bold ${getStatusColor()}`}>
              ${budgetStatus.used.toFixed(2)} / ${budgetStatus.limit.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-700 rounded-full h-4 mb-2">
          <div
            className={`h-4 rounded-full transition-all ${getBarColor()}`}
            style={{ width: `${Math.min(100, budgetStatus.percentUsed)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">
            {budgetStatus.percentUsed.toFixed(1)}% used
          </span>
          <span className="text-gray-400">
            ${budgetStatus.remaining.toFixed(2)} remaining
          </span>
        </div>

        {/* Warning for over budget */}
        {budgetStatus.percentUsed >= 80 && (
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-yellow-400">
                {budgetStatus.percentUsed >= 100
                  ? 'Budget Exceeded'
                  : 'Budget Warning'}
              </p>
              <p className="text-xs text-yellow-300/80 mt-1">
                {budgetStatus.percentUsed >= 100
                  ? 'Future requests will use free fallback model (Ollama)'
                  : 'Approaching budget limit. Consider increasing limit or using cheaper models.'}
              </p>
            </div>
          </div>
        )}

        {/* Projected spend */}
        <div className="mt-4 pt-4 border-t border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              Projected end of period
            </span>
            <span
              className={`text-sm font-semibold ${
                budgetStatus.projectedEndOfPeriod > budgetStatus.limit
                  ? 'text-red-400'
                  : 'text-green-400'
              }`}
            >
              ${budgetStatus.projectedEndOfPeriod.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Model Breakdown */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Cost by Model
        </h3>

        {sortedModels.length === 0 ? (
          <p className="text-center py-8 text-gray-400">No usage data yet</p>
        ) : (
          <div className="space-y-3">
            {sortedModels.map(([model, data]) => {
              const percentage =
                budgetStatus.used > 0
                  ? (data.cost / budgetStatus.used) * 100
                  : 0;

              return (
                <div key={model} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">{model}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400">{data.count} calls</span>
                      <span className="text-white font-semibold">
                        ${data.cost.toFixed(4)}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Usage */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Recent Usage
        </h3>

        {usageHistory.length === 0 ? (
          <p className="text-center py-8 text-gray-400">No usage history</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {usageHistory
              .slice()
              .reverse()
              .slice(0, 20)
              .map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-white">
                      {record.model}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(record.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">
                      ${record.cost.toFixed(4)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {record.inputTokens + record.outputTokens} tokens
                    </p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
