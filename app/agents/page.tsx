'use client';

import Link from 'next/link';
import AgentStatusPanel from '@/components/agents/AgentStatusPanel';

export default function AgentsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-slate-400 hover:text-white transition-colors mb-4 inline-block"
          >
            ← Back
          </Link>
          <h1 className="text-4xl font-bold text-white mb-4">
            Multi-Agent Orchestration
          </h1>
          <p className="text-slate-300 text-lg">
            Monitor and manage specialized AI agents working together
          </p>
        </div>

        {/* Agent Status Panel */}
        <AgentStatusPanel />

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <div className="text-3xl mb-3">📋</div>
            <h3 className="text-white font-semibold mb-2">Planner</h3>
            <p className="text-slate-400 text-sm">
              Breaks down complex goals into actionable steps and creates execution
              strategies
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="text-white font-semibold mb-2">Executor</h3>
            <p className="text-slate-400 text-sm">
              Carries out tasks efficiently using available tools and reports
              progress
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <div className="text-3xl mb-3">✅</div>
            <h3 className="text-white font-semibold mb-2">Reviewer</h3>
            <p className="text-slate-400 text-sm">
              Reviews outputs for quality, provides feedback, and ensures standards
              are met
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <div className="text-3xl mb-3">🔍</div>
            <h3 className="text-white font-semibold mb-2">Researcher</h3>
            <p className="text-slate-400 text-sm">
              Gathers information from multiple sources and synthesizes findings
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="text-white font-semibold mb-2">Coordinator</h3>
            <p className="text-slate-400 text-sm">
              Manages workflow between agents and ensures smooth collaboration
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <div className="text-3xl mb-3">🔄</div>
            <h3 className="text-white font-semibold mb-2">Handoffs</h3>
            <p className="text-slate-400 text-sm">
              Seamless context transfer between agents for efficient collaboration
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
