'use client';

import Link from 'next/link';
import { useState } from 'react';
import AgentStatusPanel from '@/components/agents/AgentStatusPanel';

export default function AgentsPage() {
  const [taskDescription, setTaskDescription] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('planner');
  const [isAssigning, setIsAssigning] = useState(false);

  const handleAssignTask = async () => {
    if (!taskDescription.trim()) {
      alert('Please enter a task description');
      return;
    }

    setIsAssigning(true);
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
        alert(`Task assigned to ${selectedAgent}`);
        setTaskDescription('');
      } else {
        alert('Failed to assign task');
      }
    } catch (error) {
      console.error('Task assignment failed:', error);
      alert('Error assigning task');
    } finally {
      setIsAssigning(false);
    }
  };
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

        {/* Task Assignment Interface */}
        <div className="mt-8 bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            📝 Assign Task to Agent
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
                <option value="planner">📋 Planner - Strategy & Planning</option>
                <option value="executor">⚡ Executor - Task Execution</option>
                <option value="reviewer">✅ Reviewer - Quality Assurance</option>
                <option value="researcher">🔍 Researcher - Information Gathering</option>
                <option value="coordinator">🎯 Coordinator - Orchestration</option>
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
              className={`w-full px-6 py-3 rounded-lg font-medium transition-colors ${
                isAssigning || !taskDescription.trim()
                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isAssigning ? 'Assigning...' : 'Assign Task'}
            </button>
          </div>
        </div>

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
