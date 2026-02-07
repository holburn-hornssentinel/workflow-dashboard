'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import WorkflowGraph from '@/components/graph/WorkflowGraph';
import WizardPanel from '@/components/wizard/WizardPanel';
import { useWorkflowStore } from '@/stores/workflowStore';
import { useStreamingExecution } from '@/lib/hooks/useStreamingExecution';
import { WorkflowData } from '@/types/workflow';

export default function WorkflowDetailPage() {
  const params = useParams();
  const name = params.name;
  const workflowName = typeof name === 'string' ? decodeURIComponent(name) : '';
  const [loading, setLoading] = useState(true);

  // Zustand store - use single selector to prevent multiple subscriptions
  const { workflow, nodes, edges } = useWorkflowStore((state) => ({
    workflow: state.workflow,
    nodes: state.nodes,
    edges: state.edges,
  }));

  const setWorkflow = useWorkflowStore((state) => state.setWorkflow);
  const workingDirectory = useWorkflowStore((state) => state.workingDirectory);
  const selectedModel = useWorkflowStore((state) => state.selectedModel);
  const setIsExecuting = useWorkflowStore((state) => state.setIsExecuting);

  const { streamExecution } = useStreamingExecution();
  const [showWizard, setShowWizard] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);

  const handleExecuteStep = async (stepKey: string) => {
    if (!workflow) return;

    const step = workflow.steps[stepKey];
    if (!step) return;

    setIsExecuting(true);

    try {
      const prompt = step.ai_prompt || `Execute step: ${step.name}`;

      await streamExecution(stepKey, {
        prompt,
        model: selectedModel,
        systemPrompt: `You are executing a workflow step in the directory: ${workingDirectory}`,
        terminalRef,
      });
    } catch (error) {
      console.error('Execution error:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  useEffect(() => {
    if (!workflowName) {
      setLoading(false);
      return;
    }

    fetch(`/api/workflows/${encodeURIComponent(workflowName)}`)
      .then(res => {
        if (!res.ok) {
          throw new Error('Workflow not found');
        }
        return res.json();
      })
      .then((data: WorkflowData) => {
        if ('error' in data) {
          throw new Error((data as any).error);
        }
        setWorkflow(data); // Use Zustand store
      })
      .catch(err => {
        console.error('Error loading workflow:', err);
        // Don't set null, just leave empty
      })
      .finally(() => {
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowName]); // Zustand actions are stable, don't include in deps


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading workflow...</div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">Workflow not found</div>
          <Link href="/" className="text-blue-400 hover:text-blue-300">← Back to workflows</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur p-4">
        <div className="max-w-7xl mx-auto">
          {/* Top Row: Back button + Title */}
          <div className="flex items-center gap-4 mb-2">
            <Link href="/" className="text-slate-400 hover:text-white transition-colors">
              ← Back
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">{workflow.name}</h1>
              <p className="text-slate-400 text-sm">{workflow.description}</p>
            </div>
          </div>

          {/* Bottom Row: Metadata */}
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              workflow.difficulty === 'high'
                ? 'bg-red-500/20 text-red-400'
                : workflow.difficulty === 'medium'
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-green-500/20 text-green-400'
            }`}>
              {workflow.difficulty || 'medium'}
            </span>
            <span className="text-slate-400 text-sm">
              ⏱️ {workflow.estimated_duration}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left: Graph */}
        <div className="flex-1 relative">
          <WorkflowGraph
            nodes={nodes}
            edges={edges}
            onNodeClick={undefined}
            selectedNodeId={undefined}
          />
          <button
            onClick={() => setShowWizard(!showWizard)}
            className="absolute bottom-4 right-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg transition-colors"
          >
            {showWizard ? 'Hide Wizard' : 'Show Wizard'} 🧙‍♂️
          </button>
        </div>

        {/* Right: Wizard Panel (collapsible) */}
        {showWizard && (
          <div className="w-[500px] border-l border-slate-700">
            <WizardPanel onExecuteStep={handleExecuteStep} terminalRef={terminalRef} />
          </div>
        )}
      </div>
    </div>
  );
}
