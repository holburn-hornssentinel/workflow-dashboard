'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { walkthroughSteps, WalkthroughStep } from '@/lib/walkthrough/steps';

interface WalkthroughModalProps {
  onComplete: () => void;
  onSkip: () => void;
}

export default function WalkthroughModal({ onComplete, onSkip }: WalkthroughModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const router = useRouter();

  const step = walkthroughSteps[currentStep];
  const progress = ((currentStep + 1) / walkthroughSteps.length) * 100;

  useEffect(() => {
    // Navigate to route if specified
    if (step.route && currentStep > 0) {
      router.push(step.route);
    }
  }, [currentStep, step.route, router]);

  const handleNext = () => {
    if (currentStep < walkthroughSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    onComplete();
  };

  const handleSkipTour = () => {
    setIsVisible(false);
    onSkip();
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 z-40" />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-slate-900 border-2 border-blue-500 rounded-xl shadow-2xl max-w-lg w-full">
          {/* Progress Bar */}
          <div className="h-2 bg-slate-800 rounded-t-xl overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-lg font-medium text-white mb-2">{step.title}</h2>
                <p className="text-slate-300">{step.description}</p>
              </div>
              <div className="text-sm text-slate-400 ml-4">
                {currentStep + 1} / {walkthroughSteps.length}
              </div>
            </div>

            {/* Step Indicator */}
            <div className="flex gap-1 mb-6">
              {walkthroughSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 flex-1 rounded-full transition-all ${
                    index <= currentStep ? 'bg-blue-500' : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-between">
              <button
                onClick={handleSkipTour}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors active:scale-[0.98]"
              >
                Skip Tour
              </button>
              <div className="flex gap-3">
                {currentStep > 0 && (
                  <button
                    onClick={handlePrevious}
                    className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors active:scale-[0.98]"
                  >
                    Previous
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg active:scale-[0.98]"
                >
                  {currentStep === walkthroughSteps.length - 1 ? 'Get Started!' : 'Next'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
