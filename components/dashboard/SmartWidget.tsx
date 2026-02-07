'use client';

import { useState, useEffect } from 'react';
import { getPreferences, getRecommendations } from '@/lib/personalization/preferences';
import Link from 'next/link';

export default function SmartWidget() {
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [stats, setStats] = useState({ builder: 0, vibe: 0, qa: 0, workflows: 0 });

  useEffect(() => {
    const prefs = getPreferences();
    setRecommendations(getRecommendations());
    setStats(prefs.usageCount);
  }, []);

  if (!recommendations.length) return null;

  return (
    <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl p-6 mb-8">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
          💡
        </div>
        <div className="flex-1">
          <h3 className="text-white font-semibold mb-2">Smart Recommendations</h3>
          <div className="space-y-2">
            {recommendations.map((rec, idx) => (
              <p key={idx} className="text-slate-300 text-sm">
                • {rec}
              </p>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-purple-500/20">
            <div>
              <div className="text-lg font-medium text-purple-400">{stats.builder}</div>
              <div className="text-xs text-slate-400">Builder uses</div>
            </div>
            <div>
              <div className="text-lg font-medium text-blue-400">{stats.vibe}</div>
              <div className="text-xs text-slate-400">Vibe codes</div>
            </div>
            <div>
              <div className="text-lg font-medium text-green-400">{stats.workflows}</div>
              <div className="text-xs text-slate-400">Workflows</div>
            </div>
            <div>
              <div className="text-lg font-medium text-orange-400">{stats.qa}</div>
              <div className="text-xs text-slate-400">QA runs</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
