'use client';

interface WizardNavigationProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  isExecuting?: boolean;
}

export default function WizardNavigation({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  isExecuting = false,
}: WizardNavigationProps) {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div className="flex items-center justify-between gap-4">
      {/* Previous Button */}
      <button
        onClick={onPrevious}
        disabled={isFirstStep || isExecuting}
        className={`
          flex-1 py-3 px-6 rounded-lg font-semibold transition-colors
          ${
            isFirstStep || isExecuting
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-slate-700 hover:bg-slate-600 text-white'
          }
        `}
      >
        ← Previous
      </button>

      {/* Next Button */}
      <button
        onClick={onNext}
        disabled={isLastStep || isExecuting}
        className={`
          flex-1 py-3 px-6 rounded-lg font-semibold transition-colors
          ${
            isLastStep || isExecuting
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }
        `}
      >
        {isLastStep ? 'Completed' : 'Next →'}
      </button>
    </div>
  );
}
