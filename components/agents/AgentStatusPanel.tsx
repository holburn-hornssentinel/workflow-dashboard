'use client';

import { useState, useEffect } from 'react';
import { Agent, AgentTask, AgentStatus } from '@/lib/agents/orchestrator';

const AGENT_ICONS = {
  planner: '📋',
  executor: '⚡',
  reviewer: '✅',
  researcher: '🔍',
  coordinator: '🎯',
};

const STATUS_COLORS = {
  idle: 'bg-slate-500',
  running: 'bg-blue-500 animate-pulse',
  waiting: 'bg-yellow-500',
  completed: 'bg-green-500',
  failed: 'bg-red-500',
};

interface AgentStatusPanelProps {
  refreshInterval?: number;
}

export default function AgentStatusPanel({ refreshInterval = 1000 }: AgentStatusPanelProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const fetchData = async () => {
    try {
      const [agentsRes, tasksRes] = await Promise.all([
        fetch('/api/agents'),
        fetch('/api/agents/tasks'),
      ]);

      if (agentsRes.ok) {
        const data = await agentsRes.json();
        setAgents(data.agents || []);
      }

      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Failed to fetch agent data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAgentTasks = (agentId: string) => {
    return tasks.filter((task) => task.agentId === agentId);
  };

  const getStatusBadge = (status: AgentStatus) => {
    return (
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[status]}`} />
        <span className="text-xs text-slate-400 capitalize">{status}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-white">Loading agents...</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/95 backdrop-blur border border-slate-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-medium text-white">Agent Status</h3>
        <div className="text-sm text-slate-400">
          {agents.filter((a) => a.status === 'running').length} active
        </div>
      </div>

      {agents.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          No agents registered
        </div>
      ) : (
        <div className="space-y-4">
          {agents.map((agent) => {
            const agentTasks = getAgentTasks(agent.id);
            const activeTasks = agentTasks.filter(
              (t) => t.status === 'running' || t.status === 'waiting'
            );

            return (
              <div
                key={agent.id}
                className="bg-slate-800/50 rounded-lg p-4 border border-slate-700"
              >
                {/* Agent Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">
                      {AGENT_ICONS[agent.role as keyof typeof AGENT_ICONS] || '🤖'}
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{agent.name}</h4>
                      <p className="text-sm text-slate-400">{agent.description}</p>
                    </div>
                  </div>
                  {getStatusBadge(agent.status)}
                </div>

                {/* Capabilities */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {agent.capabilities.map((cap, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded"
                    >
                      {cap}
                    </span>
                  ))}
                </div>

                {/* Active Tasks */}
                {activeTasks.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <div className="text-xs text-slate-400 mb-2">
                      Active Tasks ({activeTasks.length})
                    </div>
                    <div className="space-y-2">
                      {activeTasks.map((task) => (
                        <div
                          key={task.id}
                          className="bg-slate-900/50 rounded p-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-white line-clamp-1">
                              {task.description}
                            </span>
                            {getStatusBadge(task.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Task History */}
                {agentTasks.length > 0 && (
                  <div className="mt-2 text-xs text-slate-500">
                    Total tasks: {agentTasks.length} |{' '}
                    Completed:{' '}
                    {agentTasks.filter((t) => t.status === 'completed').length} |{' '}
                    Failed: {agentTasks.filter((t) => t.status === 'failed').length}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
