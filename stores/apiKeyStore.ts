/**
 * Zustand store for API key availability status
 * Centralizes provider key status for all client components
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ApiKeyState {
  // State
  hasAnthropicKey: boolean;
  hasGeminiKey: boolean;
  isLoading: boolean;
  lastChecked: number | null;

  // Actions
  refreshStatus: () => Promise<void>;
}

/**
 * Create API key store with persistence
 */
export const useApiKeyStore = create<ApiKeyState>()(
  persist(
    (set, get) => ({
      hasAnthropicKey: false,
      hasGeminiKey: false,
      isLoading: false,
      lastChecked: null,

      refreshStatus: async () => {
        set({ isLoading: true });

        try {
          const response = await fetch('/api/settings/env');
          if (!response.ok) {
            throw new Error('Failed to fetch API key status');
          }

          const data = await response.json();

          set({
            hasAnthropicKey: data.hasAnthropicKey || false,
            hasGeminiKey: data.hasGeminiKey || false,
            isLoading: false,
            lastChecked: Date.now(),
          });
        } catch (error) {
          console.error('[ApiKeyStore] Failed to refresh status:', error);
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'api-key-store',
      // Persist status to avoid unnecessary fetches
      partialize: (state) => ({
        hasAnthropicKey: state.hasAnthropicKey,
        hasGeminiKey: state.hasGeminiKey,
        lastChecked: state.lastChecked,
      }),
    }
  )
);
