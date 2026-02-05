'use client';

import { useState } from 'react';
import { Save, DollarSign, Sliders } from 'lucide-react';
import { useRouterStore } from '@/stores/routerStore';

export function BudgetConfig() {
  const { config, updateBudget, updateConfig } = useRouterStore();

  // Budget limits
  const [dailyLimit, setDailyLimit] = useState(config.budgetLimit);
  const [weeklyLimit, setWeeklyLimit] = useState(config.budgetLimit * 7);
  const [monthlyLimit, setMonthlyLimit] = useState(config.budgetLimit * 30);

  // Budget exceeded actions
  const [autoThrottle, setAutoThrottle] = useState(false);
  const [blockWhenExceeded, setBlockWhenExceeded] = useState(false);
  const [sendNotifications, setSendNotifications] = useState(true);

  // Model parameters
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2000);

  const handleSave = () => {
    // Update budget settings
    updateBudget(dailyLimit, 'day');

    // Note: In a full implementation, you would save these to config
    // For now, just show a success message
    alert('Budget configuration saved successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Budget Limits Section */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Budget Limits</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Daily Limit */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Daily Limit ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={dailyLimit}
              onChange={(e) => setDailyLimit(parseFloat(e.target.value))}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Weekly Limit */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Weekly Limit ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={weeklyLimit}
              onChange={(e) => setWeeklyLimit(parseFloat(e.target.value))}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Monthly Limit */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Monthly Limit ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={monthlyLimit}
              onChange={(e) => setMonthlyLimit(parseFloat(e.target.value))}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Budget Exceeded Actions */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Budget Exceeded Actions
        </h3>

        <div className="space-y-4">
          {/* Auto-throttle Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-medium">Auto-throttle Requests</div>
              <div className="text-sm text-slate-400">
                Automatically slow down requests when approaching limit
              </div>
            </div>
            <button
              onClick={() => setAutoThrottle(!autoThrottle)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                autoThrottle ? 'bg-blue-600' : 'bg-slate-600'
              }`}
            >
              <div
                className={`absolute top-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                  autoThrottle ? 'translate-x-7' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Block when exceeded Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-medium">Block When Exceeded</div>
              <div className="text-sm text-slate-400">
                Stop all requests when budget limit is reached
              </div>
            </div>
            <button
              onClick={() => setBlockWhenExceeded(!blockWhenExceeded)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                blockWhenExceeded ? 'bg-blue-600' : 'bg-slate-600'
              }`}
            >
              <div
                className={`absolute top-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                  blockWhenExceeded ? 'translate-x-7' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Send notifications Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-medium">Send Notifications</div>
              <div className="text-sm text-slate-400">
                Receive alerts at 80% and 100% of budget limit
              </div>
            </div>
            <button
              onClick={() => setSendNotifications(!sendNotifications)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                sendNotifications ? 'bg-blue-600' : 'bg-slate-600'
              }`}
            >
              <div
                className={`absolute top-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                  sendNotifications ? 'translate-x-7' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Model Parameters */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sliders className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Model Parameters</h3>
        </div>

        <div className="space-y-6">
          {/* Temperature Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">
                Temperature
              </label>
              <span className="text-sm font-mono text-blue-400">{temperature.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>Precise (0.0)</span>
              <span>Balanced (1.0)</span>
              <span>Creative (2.0)</span>
            </div>
          </div>

          {/* Max Tokens Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">
                Max Tokens
              </label>
              <span className="text-sm font-mono text-purple-400">{maxTokens}</span>
            </div>
            <input
              type="range"
              min="100"
              max="8000"
              step="100"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>Short (100)</span>
              <span>Medium (4000)</span>
              <span>Long (8000)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <Save className="w-5 h-5" />
        Save Configuration
      </button>
    </div>
  );
}
