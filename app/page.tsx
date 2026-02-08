import Link from 'next/link';
import { loadWorkflows, getWorkflowStats, workflowToSlug } from '@/lib/workflow-parser';
import HomeContent from '@/components/home/HomeContent';
import SmartWidget from '@/components/dashboard/SmartWidget';

export default function Home() {
  const workflows = loadWorkflows();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white mb-4">
                🎯 Horns Workflow Control Center
              </h1>
              <p className="text-slate-300 text-lg">
                Visual workflow management for your AI development platform
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/settings"
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white text-sm font-medium active:scale-[0.98] rounded-lg transition-colors"
              >
                ⚙️ Settings
              </Link>
              <Link
                href="/memory"
                className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium active:scale-[0.98] rounded-lg transition-colors"
              >
                🧠 Memory
              </Link>
              <Link
                href="/agents"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium active:scale-[0.98] rounded-lg transition-colors"
              >
                🤖 Agents
              </Link>
              <Link
                href="/tools"
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium active:scale-[0.98] rounded-lg transition-colors"
              >
                🔧 MCP Tools
              </Link>
              <Link
                href="/builder"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium active:scale-[0.98] rounded-lg transition-colors"
              >
                🎨 Visual Builder
              </Link>
            </div>
          </div>
        </div>

        <HomeContent />

        {/* Smart Recommendations Widget */}
        <SmartWidget />

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800/50 backdrop-blur border border-white/[0.06] rounded-lg p-4 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200">
            <div className="text-2xl font-semibold tracking-tight text-blue-400">{workflows.length}</div>
            <div className="text-slate-400 text-sm mt-1">Workflows Available</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur border border-white/[0.06] rounded-lg p-4 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200">
            <div className="text-2xl font-semibold tracking-tight text-green-400">
              {workflows.reduce((acc, w) => acc + Object.keys(w.steps).length, 0)}
            </div>
            <div className="text-slate-400 text-sm mt-1">Total Steps</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur border border-white/[0.06] rounded-lg p-4 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200">
            <div className="text-2xl font-semibold tracking-tight text-purple-400">✅</div>
            <div className="text-slate-400 text-sm mt-1">Claude Max Active</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur border border-white/[0.06] rounded-lg p-4 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200">
            <div className="text-2xl font-semibold tracking-tight text-orange-400">
              {workflows.filter(w => w.difficulty === 'high').length}
            </div>
            <div className="text-slate-400 text-sm mt-1">Complex Workflows</div>
          </div>
        </div>

        {/* Workflow Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {workflows.map((workflow, index) => {
            const stats = getWorkflowStats(workflow);

            return (
              <Link
                key={index}
                href={`/workflows/${workflowToSlug(workflow)}`}
                className="group"
              >
                <div className="bg-slate-800/50 backdrop-blur border border-white/[0.06] rounded-xl p-4 hover:border-blue-500 hover:-translate-y-0.5 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/20">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-base font-medium text-white group-hover:text-blue-400 transition-colors">
                        {workflow.name}
                      </h3>
                      <p className="text-slate-400 text-sm mt-1">
                        {workflow.description}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      workflow.difficulty === 'high'
                        ? 'bg-red-500/20 text-red-400'
                        : workflow.difficulty === 'medium'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-green-500/20 text-green-400'
                    }`}>
                      {workflow.difficulty || 'medium'}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-white/[0.06]">
                    <div>
                      <div className="text-sm text-slate-500">Steps</div>
                      <div className="text-base font-medium text-white">{stats.stepCount}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">Tasks</div>
                      <div className="text-base font-medium text-white">{stats.totalTasks}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">Duration</div>
                      <div className="text-base font-medium text-white text-xs">
                        {stats.estimatedDuration}
                      </div>
                    </div>
                  </div>

                  {/* Models Used */}
                  {stats.modelsUsed.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {stats.modelsUsed.map((model, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-slate-700/50 text-slate-300 rounded text-xs"
                        >
                          {model}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Arrow */}
                  <div className="mt-4 flex items-center text-blue-400 text-sm font-medium">
                    <span className="group-hover:translate-x-1 transition-transform">
                      View Workflow →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Empty State */}
        {workflows.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-lg font-medium text-white mb-2">No Workflows Found</h3>
            <p className="text-slate-400">
              Workflows should be located at <code className="bg-slate-700 px-2 py-1 rounded">~/.claude/workflows/</code>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
