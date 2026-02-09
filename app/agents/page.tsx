'use client';

import Link from 'next/link';
import { useState } from 'react';
import AgentStatusPanel from '@/components/agents/AgentStatusPanel';
import { FileEdit, ClipboardList, Zap, CheckCircle, Search, Target, RefreshCw } from 'lucide-react';

export default function AgentsPage() {
  const [taskDescription, setTaskDescription] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('planner');
  const [isAssigning, setIsAssigning] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAssignTask = async () => {
    if (!taskDescription.trim()) {
      setMessage({ type: 'error', text: 'Please enter a task description' });
      return;
    }

    setIsAssigning(true);
    setMessage(null);

    try {
      const response = await fetch('/api/agents/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: selectedAgent,
          task: taskDescription,
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: `Task assigned to ${selectedAgent} successfully!` });
        setTaskDescription('');
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to assign task' });
      }
    } catch (error) {
      console.error('Task assignment failed:', error);
      setMessage({ type: 'error', text: 'Error assigning task. Please try again.' });
    } finally {
      setIsAssigning(false);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/"
            className="text-slate-400 hover:text-white transition-colors mb-4 inline-block"
          >
            ← Back
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-white mb-4">
            Multi-Agent Orchestration
          </h1>
          <p className="text-slate-300 text-lg">
            Monitor and manage specialized AI agents working together
          </p>
        </div>

        {/* Agent Status Panel */}
        <AgentStatusPanel />

        {/* Task Assignment Interface */}
        <div className="mt-8 bg-slate-800/50 border border-white/[0.06] rounded-lg p-4">
          <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <FileEdit className="h-5 w-5" /> Assign Task to Agent
          </h2>

          <div className="space-y-4">
            {/* Agent Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Select Agent
              </label>
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500"
              >
                <option value="planner">Planner - Strategy & Planning</option>
                <option value="executor">Executor - Task Execution</option>
                <option value="reviewer">Reviewer - Quality Assurance</option>
                <option value="researcher">Researcher - Information Gathering</option>
                <option value="coordinator">Coordinator - Orchestration</option>
              </select>
            </div>

            {/* Task Description */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Task Description
              </label>
              <textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Describe the task you want to assign... (e.g., 'Analyze the security vulnerabilities in the authentication system')"
                rows={4}
                className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            {/* Assign Button */}
            <button
              onClick={handleAssignTask}
              disabled={isAssigning || !taskDescription.trim()}
              className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                isAssigning || !taskDescription.trim()
                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isAssigning ? 'Assigning...' : 'Assign Task'}
            </button>

            {/* Success/Error Message */}
            {message && (
              <div
                className={`p-4 rounded-lg ${
                  message.type === 'success'
                    ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                    : 'bg-red-500/20 border border-red-500/50 text-red-400'
                }`}
              >
                {message.text}
              </div>
            )}
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-slate-800/50 border border-white/[0.06] rounded-lg p-4 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200">
            <div className="mb-3"><ClipboardList className="h-8 w-8 text-blue-400" /></div>
            <h3 className="text-white font-semibold mb-2">Planner</h3>
            <p className="text-slate-400 text-sm">
              Breaks down complex goals into actionable steps and creates execution
              strategies
            </p>
          </div>

          <div className="bg-slate-800/50 border border-white/[0.06] rounded-lg p-4 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200">
            <div className="mb-3"><Zap className="h-8 w-8 text-yellow-400" /></div>
            <h3 className="text-white font-semibold mb-2">Executor</h3>
            <p className="text-slate-400 text-sm">
              Carries out tasks efficiently using available tools and reports
              progress
            </p>
          </div>

          <div className="bg-slate-800/50 border border-white/[0.06] rounded-lg p-4 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200">
            <div className="mb-3"><CheckCircle className="h-8 w-8 text-green-400" /></div>
            <h3 className="text-white font-semibold mb-2">Reviewer</h3>
            <p className="text-slate-400 text-sm">
              Reviews outputs for quality, provides feedback, and ensures standards
              are met
            </p>
          </div>

          <div className="bg-slate-800/50 border border-white/[0.06] rounded-lg p-4 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200">
            <div className="mb-3"><Search className="h-8 w-8 text-purple-400" /></div>
            <h3 className="text-white font-semibold mb-2">Researcher</h3>
            <p className="text-slate-400 text-sm">
              Gathers information from multiple sources and synthesizes findings
            </p>
          </div>

          <div className="bg-slate-800/50 border border-white/[0.06] rounded-lg p-4 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200">
            <div className="mb-3"><Target className="h-8 w-8 text-orange-400" /></div>
            <h3 className="text-white font-semibold mb-2">Coordinator</h3>
            <p className="text-slate-400 text-sm">
              Manages workflow between agents and ensures smooth collaboration
            </p>
          </div>

          <div className="bg-slate-800/50 border border-white/[0.06] rounded-lg p-4 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200">
            <div className="mb-3"><RefreshCw className="h-8 w-8 text-cyan-400" /></div>
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
