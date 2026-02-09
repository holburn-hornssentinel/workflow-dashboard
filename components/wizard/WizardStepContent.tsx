'use client';

import { useRef } from 'react';
import ModelSelector from '@/components/ModelSelector';
import StreamingTerminal from '@/components/execution/StreamingTerminal';
import { useStreamingExecution } from '@/lib/hooks/useStreamingExecution';
import { WorkflowStep } from '@/types/workflow';
import { Timer, Bot, Hourglass, Play } from 'lucide-react';

interface WizardStepContentProps {
  step: WorkflowStep;
  stepKey: string;
  selectedModel: string;
  isExecuting: boolean;
  onModelChange: (model: string) => void;
  onExecute: (stepKey: string) => void;
  terminalRef?: React.RefObject<HTMLDivElement>;
}

export default function WizardStepContent({
  step,
  stepKey,
  selectedModel,
  isExecuting,
  onModelChange,
  onExecute,
  terminalRef: externalTerminalRef,
}: WizardStepContentProps) {
  const internalTerminalRef = useRef<HTMLDivElement>(null);
  const terminalRef = externalTerminalRef || internalTerminalRef;
  const { isStreaming, abort } = useStreamingExecution();

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div>
        <h2 className="text-lg font-medium text-white mb-2">{step.name}</h2>
        {step.duration && (
          <p className="text-slate-400 text-sm flex items-center gap-1">
            <Timer className="h-4 w-4" />
            Duration: {step.duration}
          </p>
        )}
        {step.model_recommendation && (
          <div className="mt-2">
            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs flex items-center gap-1 inline-flex">
              <Bot className="h-3 w-3" />
              Recommended: {step.model_recommendation}
            </span>
          </div>
        )}
      </div>

      {/* Model Selector */}
      <div>
        <ModelSelector
          selectedModel={selectedModel}
          onChange={onModelChange}
          recommendation={step.model_recommendation}
        />
      </div>

      {/* Execute Button */}
      <button
        onClick={() => onExecute(stepKey)}
        disabled={isExecuting}
        className={`
          w-full font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2
          ${
            isExecuting
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }
        `}
      >
        {isExecuting ? (
          <>
            <Hourglass className="h-4 w-4" />
            Executing...
          </>
        ) : (
          <>
            <Play className="h-4 w-4" />
            Execute This Step
          </>
        )}
      </button>

      {/* Streaming Terminal */}
      <div className="h-96">
        <StreamingTerminal isStreaming={isStreaming} onStop={abort} />
      </div>

      {/* AI Prompt */}
      {step.ai_prompt && (
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-2">AI Prompt:</h3>
          <div className="bg-slate-800/50 rounded p-4 text-slate-400 text-sm whitespace-pre-wrap max-h-48 overflow-y-auto">
            {step.ai_prompt}
          </div>
        </div>
      )}

      {/* Tasks */}
      {step.tasks && Object.keys(step.tasks).length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-2">
            Tasks ({Object.keys(step.tasks).length}):
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {Object.entries(step.tasks).map(([key, task]: [string, any]) => (
              <div key={key} className="bg-slate-800/50 rounded p-3">
                <div className="text-white text-sm font-medium mb-1">{task.name}</div>
                {task.ai_prompt && (
                  <div className="text-slate-400 text-xs line-clamp-2">
                    {task.ai_prompt}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Checklist */}
      {step.checklist && step.checklist.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-2">Checklist:</h3>
          <div className="space-y-2">
            {step.checklist.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1 rounded border-slate-600 bg-slate-800"
                />
                <span className="text-slate-400 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
