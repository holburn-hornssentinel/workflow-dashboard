'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useRouterStore } from '@/stores/routerStore';

export function SpendingChart() {
  const { usageHistory } = useRouterStore();

  const chartData = useMemo(() => {
    // Get last 7 days
    const days = 7;
    const now = new Date();
    const dayLabels: string[] = [];
    const spending: Record<string, number> = {};

    // Initialize last 7 days
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dayKey = date.toISOString().split('T')[0];
      dayLabels.push(dayLabel);
      spending[dayKey] = 0;
    }

    // Aggregate usage by day
    usageHistory.forEach((record) => {
      const recordDate = new Date(record.timestamp);
      const dayKey = recordDate.toISOString().split('T')[0];
      if (spending[dayKey] !== undefined) {
        spending[dayKey] += record.cost;
      }
    });

    // Convert to chart data format
    const data = Object.keys(spending).map((dayKey, index) => ({
      day: dayLabels[index],
      spending: spending[dayKey],
    }));

    return data;
  }, [usageHistory]);

  const totalSpending = chartData.reduce((sum, day) => sum + day.spending, 0);
  const avgSpending = totalSpending / 7;

  return (
    <div className="bg-slate-800/50 backdrop-blur border border-white/[0.06] rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-medium text-white">7-Day Spending Trend</h3>
          <p className="text-sm text-slate-400">Daily API usage costs</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400">Avg per day</div>
          <div className="text-base font-medium text-blue-400">
            ${avgSpending.toFixed(2)}
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="day"
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
          />
          <YAxis
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            tickFormatter={(value) => `$${value.toFixed(2)}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
              color: '#fff',
            }}
            formatter={(value: number | undefined) => value !== undefined ? [`$${value.toFixed(4)}`, 'Spending'] : ['$0.0000', 'Spending']}
          />
          <Bar dataKey="spending" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {totalSpending === 0 && (
        <div className="text-center text-slate-400 text-sm mt-4">
          No spending data for the last 7 days
        </div>
      )}
    </div>
  );
}
