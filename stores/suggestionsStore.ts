import { create } from 'zustand';
import type { Suggestion, AnalysisResult } from '@/types/suggestions';

interface SuggestionsState {
  suggestions: Suggestion[];
  workflowScore: number;
  isAnalyzing: boolean;
  isOpen: boolean;

  // Actions
  setSuggestions: (result: AnalysisResult) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  toggleOpen: () => void;
  setIsOpen: (open: boolean) => void;
  dismissSuggestion: (id: string) => void;
  clearSuggestions: () => void;
}

export const useSuggestionsStore = create<SuggestionsState>((set) => ({
  suggestions: [],
  workflowScore: 0,
  isAnalyzing: false,
  isOpen: true,

  setSuggestions: (result: AnalysisResult) => {
    set({
      suggestions: result.suggestions,
      workflowScore: result.workflowScore,
    });
  },

  setIsAnalyzing: (analyzing: boolean) => {
    set({ isAnalyzing: analyzing });
  },

  toggleOpen: () => {
    set((state) => ({ isOpen: !state.isOpen }));
  },

  setIsOpen: (open: boolean) => {
    set({ isOpen: open });
  },

  dismissSuggestion: (id: string) => {
    set((state) => ({
      suggestions: state.suggestions.filter((s) => s.id !== id),
    }));
  },

  clearSuggestions: () => {
    set({ suggestions: [], workflowScore: 0 });
  },
}));
