'use client';

import { useWorkflowStore, useCurrentStep } from '@/stores/workflowStore';
import WizardProgressBar from './WizardProgressBar';
import WizardNavigation from './WizardNavigation';
import WizardStepContent from './WizardStepContent';
import { StreamingTerminalHandle } from '@/components/execution/StreamingTerminal';
import { Wand2 } from 'lucide-react';

interface WizardPanelProps {
  onExecuteStep: (stepKey: string) => void;
  terminalRef?: React.RefObject<StreamingTerminalHandle>;
}

export default function WizardPanel({ onExecuteStep, terminalRef }: WizardPanelProps) {
  const currentStep = useCurrentStep();
  const {
    stepOrder,
    selectedModel,
    isExecuting,
    setSelectedModel,
    nextStep,
    previousStep,
  } = useWorkflowStore((state) => ({
    stepOrder: state.stepOrder,
    selectedModel: state.selectedModel,
    isExecuting: state.isExecuting,
    setSelectedModel: state.setSelectedModel,
    nextStep: state.nextStep,
    previousStep: state.previousStep,
  }));

  if (!currentStep) {
    return (
      <div className="h-full bg-slate-900/95 backdrop-blur flex items-center justify-center">
        <div className="text-center p-8">
          <div className="flex justify-center mb-4">
            <Wand2 className="h-16 w-16 text-slate-600" />
          </div>
          <h3 className="text-base font-medium text-white mb-2">No Workflow Loaded</h3>
          <p className="text-slate-400 text-sm">
            Select a workflow to begin the guided wizard
          </p>
        </div>
      </div>
    );
  }

  // Destructure after null check for TypeScript
  const { index, total, step, key } = currentStep;

  return (
    <div className="h-full bg-slate-900/95 backdrop-blur flex flex-col">
      {/* Wizard Header */}
      <div className="border-b border-white/[0.06] bg-slate-800/50 p-4">
        <h2 className="text-base font-medium text-white mb-4">Workflow Wizard</h2>
        <WizardProgressBar
          currentStep={index}
          totalSteps={total}
          stepNames={stepOrder}
        />
      </div>

      {/* Wizard Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <WizardStepContent
          step={step}
          stepKey={key}
          selectedModel={selectedModel}
          isExecuting={isExecuting}
          onModelChange={setSelectedModel}
          onExecute={onExecuteStep}
          terminalRef={terminalRef}
        />
      </div>

      {/* Wizard Footer */}
      <div className="border-t border-white/[0.06] bg-slate-800/50 p-4">
        <WizardNavigation
          currentStep={index}
          totalSteps={total}
          onPrevious={previousStep}
          onNext={nextStep}
          isExecuting={isExecuting}
        />
      </div>
    </div>
  );
}
