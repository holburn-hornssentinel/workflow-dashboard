'use client';

interface WizardProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepNames?: string[];
}

export default function WizardProgressBar({
  currentStep,
  totalSteps,
  stepNames = [],
}: WizardProgressBarProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="relative w-full h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
        <div
          className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-300 ease-in-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step Counter */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">
          Step {currentStep + 1} of {totalSteps}
        </span>
        <span className="text-slate-400">
          {Math.round(progress)}% Complete
        </span>
      </div>
    </div>
  );
}
