/**
 * Zustand store for AI model router state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  ModelRouter,
  createDefaultRouterConfig,
  type RouterConfig,
  type RoutingRule,
  type TaskContext,
  type ModelConfig,
} from '@/lib/ai/router';
import type { BudgetStatus, UsageRecord } from '@/lib/ai/cost-tracker';

interface RouterState {
  // State
  router: ModelRouter;
  config: RouterConfig;
  budgetStatus: BudgetStatus;
  usageHistory: UsageRecord[];
  isLoading: boolean;

  // Actions
  updateBudget: (limit: number, period: 'day' | 'week' | 'month') => void;
  addRoutingRule: (rule: RoutingRule) => void;
  removeRoutingRule: (ruleId: string) => void;
  updateConfig: (config: Partial<RouterConfig>) => void;
  selectModel: (taskType: string, context: TaskContext) => ModelConfig;
  trackUsage: (
    model: string,
    inputTokens: number,
    outputTokens: number,
    taskType?: string
  ) => void;
  refreshBudgetStatus: () => Promise<void>;
  refreshUsageHistory: () => void;
  exportUsageData: () => string;
  importUsageData: (data: string) => void;
  resetToDefaults: () => void;
}

/**
 * Create router store with persistence
 */
export const useRouterStore = create<RouterState>()(
  persist(
    (set, get) => {
      const defaultConfig = createDefaultRouterConfig();
      const router = new ModelRouter(defaultConfig);

      return {
        router,
        config: defaultConfig,
        budgetStatus: router.getBudgetStatus(),
        usageHistory: [],
        isLoading: false,

        updateBudget: (limit: number, period: 'day' | 'week' | 'month') => {
          const { router } = get();
          router.updateBudget(limit, period);

          set({
            config: router.getConfig(),
            budgetStatus: router.getBudgetStatus(),
          });
        },

        addRoutingRule: (rule: RoutingRule) => {
          const { router } = get();
          router.addRoutingRule(rule);

          set({
            config: router.getConfig(),
          });
        },

        removeRoutingRule: (ruleId: string) => {
          const { router } = get();
          router.removeRoutingRule(ruleId);

          set({
            config: router.getConfig(),
          });
        },

        updateConfig: (config: Partial<RouterConfig>) => {
          const { router } = get();
          router.updateConfig(config);

          set({
            config: router.getConfig(),
            budgetStatus: router.getBudgetStatus(),
          });
        },

        selectModel: (taskType: string, context: TaskContext) => {
          const { router } = get();
          return router.selectModel(taskType, context);
        },

        trackUsage: (
          model: string,
          inputTokens: number,
          outputTokens: number,
          taskType?: string
        ) => {
          const { router } = get();
          router.trackUsage(model, inputTokens, outputTokens, taskType);

          // Update state
          set({
            budgetStatus: router.getBudgetStatus(),
            usageHistory: router.getCostTracker().getAllRecords(),
          });
        },

        refreshBudgetStatus: async () => {
          set({ isLoading: true });

          try {
            const { router } = get();
            const budgetStatus = router.getBudgetStatus();

            set({
              budgetStatus,
              isLoading: false,
            });
          } catch (error) {
            console.error('[RouterStore] Failed to refresh budget status:', error);
            set({ isLoading: false });
          }
        },

        refreshUsageHistory: () => {
          const { router } = get();
          const usageHistory = router.getCostTracker().getAllRecords();

          set({ usageHistory });
        },

        exportUsageData: () => {
          const { router } = get();
          return router.getCostTracker().exportData();
        },

        importUsageData: (data: string) => {
          const { router } = get();
          router.getCostTracker().importData(data);

          set({
            budgetStatus: router.getBudgetStatus(),
            usageHistory: router.getCostTracker().getAllRecords(),
          });
        },

        resetToDefaults: () => {
          const defaultConfig = createDefaultRouterConfig();
          const newRouter = new ModelRouter(defaultConfig);

          set({
            router: newRouter,
            config: defaultConfig,
            budgetStatus: newRouter.getBudgetStatus(),
            usageHistory: [],
          });
        },
      };
    },
    {
      name: 'router-store',
      // Only persist config and usage data, not the router instance
      partialize: (state) => ({
        config: state.config,
        usageHistory: state.usageHistory,
      }),
      // Recreate router from persisted config after rehydration
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Recreate router instance with persisted config
          const router = new ModelRouter(state.config);

          // Restore usage history
          if (state.usageHistory && state.usageHistory.length > 0) {
            const costTracker = router.getCostTracker();
            // Import usage data if available
            try {
              state.usageHistory.forEach((record) => {
                costTracker.record({
                  model: record.model,
                  inputTokens: record.inputTokens,
                  outputTokens: record.outputTokens,
                  taskType: record.taskType,
                });
              });
            } catch (error) {
              console.error('[RouterStore] Failed to restore usage history:', error);
            }
          }

          state.router = router;
          state.budgetStatus = router.getBudgetStatus();
        }
      },
    }
  )
);
