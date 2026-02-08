'use client';

import { useState, useEffect } from 'react';
import WalkthroughModal from '@/components/walkthrough/WalkthroughModal';
import ProgressChecklist from '@/components/walkthrough/ProgressChecklist';

export default function HomeContent() {
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [showTutorialButton, setShowTutorialButton] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);

  useEffect(() => {
    // Check if first visit
    if (typeof window !== 'undefined') {
      const completed = localStorage.getItem('walkthrough-completed');
      if (!completed) {
        setTimeout(() => setShowWalkthrough(true), 1000);
        setShowChecklist(true);
      }
      setShowTutorialButton(true);
    }
  }, []);

  const handleWalkthroughComplete = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('walkthrough-completed', 'true');
    }
    setShowWalkthrough(false);
  };

  const handleWalkthroughSkip = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('walkthrough-completed', 'true');
    }
    setShowWalkthrough(false);
  };

  return (
    <>
      {/* Tutorial Button - Floating */}
      {showTutorialButton && (
        <div className="fixed bottom-8 right-8 z-30">
          <button
            onClick={() => setShowWalkthrough(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium active:scale-[0.98] rounded-lg shadow-lg transition-all hover:scale-105"
          >
            📖 Tutorial
          </button>
        </div>
      )}

      {/* Walkthrough Modal */}
      {showWalkthrough && (
        <WalkthroughModal
          onComplete={handleWalkthroughComplete}
          onSkip={handleWalkthroughSkip}
        />
      )}

      {/* Progress Checklist */}
      {showChecklist && <ProgressChecklist />}
    </>
  );
}
