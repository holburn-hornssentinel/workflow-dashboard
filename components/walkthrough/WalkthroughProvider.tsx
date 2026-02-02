'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface WalkthroughContextType {
  isActive: boolean;
  startWalkthrough: () => void;
  skipWalkthrough: () => void;
  hasCompletedWalkthrough: boolean;
}

const WalkthroughContext = createContext<WalkthroughContextType | undefined>(undefined);

export function WalkthroughProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [hasCompletedWalkthrough, setHasCompletedWalkthrough] = useState(true);

  useEffect(() => {
    // Check if user has completed walkthrough
    if (typeof window !== 'undefined') {
      const completed = localStorage.getItem('walkthrough-completed');
      if (!completed) {
        setHasCompletedWalkthrough(false);
        // Auto-start walkthrough for first-time users
        setTimeout(() => setIsActive(true), 1000);
      }
    }
  }, []);

  const startWalkthrough = () => {
    setIsActive(true);
  };

  const skipWalkthrough = () => {
    setIsActive(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('walkthrough-completed', 'true');
      setHasCompletedWalkthrough(true);
    }
  };

  return (
    <WalkthroughContext.Provider
      value={{
        isActive,
        startWalkthrough,
        skipWalkthrough,
        hasCompletedWalkthrough,
      }}
    >
      {children}
    </WalkthroughContext.Provider>
  );
}

export function useWalkthrough() {
  const context = useContext(WalkthroughContext);
  if (!context) {
    throw new Error('useWalkthrough must be used within WalkthroughProvider');
  }
  return context;
}
