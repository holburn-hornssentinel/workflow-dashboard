/**
 * Zustand store for permission management
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ToolPermission,
  PermissionRequest,
  PermissionResponse,
  PermissionLevel,
  PermissionConfig,
} from '@/types/permissions';

interface PermissionsState {
  // State
  config: PermissionConfig;
  toolPermissions: Map<string, ToolPermission>;
  pendingRequests: PermissionRequest[];
  requestHistory: PermissionRequest[];

  // Actions
  setPermissionLevel: (toolId: string, level: PermissionLevel) => void;
  setToolPermission: (permission: ToolPermission) => void;
  removeToolPermission: (toolId: string) => void;
  requestPermission: (
    request: Omit<PermissionRequest, 'id' | 'status' | 'requestedAt'>
  ) => Promise<PermissionRequest>;
  approveRequest: (requestId: string, reason?: string, remember?: boolean) => void;
  denyRequest: (requestId: string, reason?: string, remember?: boolean) => void;
  checkPermission: (
    type: 'tool' | 'command' | 'file',
    details: Record<string, unknown>
  ) => PermissionLevel;
  clearPendingRequests: () => void;
  clearRequestHistory: () => void;
  updateConfig: (config: Partial<PermissionConfig>) => void;
}

const defaultConfig: PermissionConfig = {
  defaultLevel: 'confirm',
  autoApproveTimeoutMs: 30000, // 30 seconds
  toolPermissions: new Map(),
  rememberedChoices: new Map(),
};

export const usePermissionsStore = create<PermissionsState>()(
  persist(
    (set, get) => ({
      config: defaultConfig,
      toolPermissions: new Map([
        // Default dangerous tool permissions
        [
          'filesystem:delete_file',
          {
            toolId: 'filesystem:delete_file',
            level: 'confirm',
            requiresReason: true,
            description: 'Delete files from filesystem',
          },
        ],
        [
          'filesystem:write_file',
          {
            toolId: 'filesystem:write_file',
            level: 'confirm',
            requiresReason: false,
            description: 'Write files to filesystem',
          },
        ],
        [
          'git:push',
          {
            toolId: 'git:push',
            level: 'confirm',
            requiresReason: true,
            description: 'Push changes to remote repository',
          },
        ],
        [
          'git:force_push',
          {
            toolId: 'git:force_push',
            level: 'block',
            requiresReason: true,
            description: 'Force push to remote repository',
          },
        ],
        [
          'database:execute_query',
          {
            toolId: 'database:execute_query',
            level: 'confirm',
            requiresReason: false,
            description: 'Execute database queries',
          },
        ],
      ]),
      pendingRequests: [],
      requestHistory: [],

      setPermissionLevel: (toolId: string, level: PermissionLevel) => {
        set((state) => {
          const newPermissions = new Map(state.toolPermissions);
          const existing = newPermissions.get(toolId);

          if (existing) {
            newPermissions.set(toolId, { ...existing, level });
          } else {
            newPermissions.set(toolId, {
              toolId,
              level,
              requiresReason: level === 'block',
              description: `Permission for ${toolId}`,
            });
          }

          return { toolPermissions: newPermissions };
        });
      },

      setToolPermission: (permission: ToolPermission) => {
        set((state) => {
          const newPermissions = new Map(state.toolPermissions);
          newPermissions.set(permission.toolId, permission);
          return { toolPermissions: newPermissions };
        });
      },

      removeToolPermission: (toolId: string) => {
        set((state) => {
          const newPermissions = new Map(state.toolPermissions);
          newPermissions.delete(toolId);
          return { toolPermissions: newPermissions };
        });
      },

      requestPermission: async (
        request: Omit<PermissionRequest, 'id' | 'status' | 'requestedAt'>
      ): Promise<PermissionRequest> => {
        return new Promise((resolve) => {
          const permissionRequest: PermissionRequest = {
            ...request,
            id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            status: 'pending',
            requestedAt: new Date(),
          };

          set((state) => ({
            pendingRequests: [...state.pendingRequests, permissionRequest],
          }));

          // Set up auto-timeout
          const timeoutId = setTimeout(() => {
            const state = get();
            const pending = state.pendingRequests.find(
              (r) => r.id === permissionRequest.id
            );

            if (pending && pending.status === 'pending') {
              // Auto-deny on timeout
              get().denyRequest(permissionRequest.id, 'Request timeout');
              resolve({ ...permissionRequest, status: 'timeout' });
            }
          }, get().config.autoApproveTimeoutMs);

          // Store cleanup function
          (permissionRequest as any)._cleanup = () => clearTimeout(timeoutId);

          resolve(permissionRequest);
        });
      },

      approveRequest: (requestId: string, reason?: string, remember?: boolean) => {
        set((state) => {
          const request = state.pendingRequests.find((r) => r.id === requestId);
          if (!request) return state;

          const approvedRequest: PermissionRequest = {
            ...request,
            status: 'approved',
            respondedAt: new Date(),
            reason,
            rememberChoice: remember,
          };

          // Remember choice if requested
          let newConfig = state.config;
          if (remember && request.toolId) {
            const newRemembered = new Map(state.config.rememberedChoices);
            newRemembered.set(request.toolId, true);
            newConfig = { ...state.config, rememberedChoices: newRemembered };
          }

          return {
            pendingRequests: state.pendingRequests.filter((r) => r.id !== requestId),
            requestHistory: [...state.requestHistory, approvedRequest],
            config: newConfig,
          };
        });
      },

      denyRequest: (requestId: string, reason?: string, remember?: boolean) => {
        set((state) => {
          const request = state.pendingRequests.find((r) => r.id === requestId);
          if (!request) return state;

          const deniedRequest: PermissionRequest = {
            ...request,
            status: 'denied',
            respondedAt: new Date(),
            reason,
            rememberChoice: remember,
          };

          // Remember choice if requested
          let newConfig = state.config;
          if (remember && request.toolId) {
            const newRemembered = new Map(state.config.rememberedChoices);
            newRemembered.set(request.toolId, false);
            newConfig = { ...state.config, rememberedChoices: newRemembered };
          }

          return {
            pendingRequests: state.pendingRequests.filter((r) => r.id !== requestId),
            requestHistory: [...state.requestHistory, deniedRequest],
            config: newConfig,
          };
        });
      },

      checkPermission: (
        type: 'tool' | 'command' | 'file',
        details: Record<string, unknown>
      ): PermissionLevel => {
        const state = get();

        // For tool type, check tool-specific permission
        if (type === 'tool' && details.toolId) {
          const toolId = details.toolId as string;

          // Check remembered choices first
          const remembered = state.config.rememberedChoices.get(toolId);
          if (remembered !== undefined) {
            return remembered ? 'auto' : 'block';
          }

          // Check tool-specific permission
          const permission = state.toolPermissions.get(toolId);
          if (permission) {
            return permission.level;
          }
        }

        // Return default level
        return state.config.defaultLevel;
      },

      clearPendingRequests: () => {
        set({ pendingRequests: [] });
      },

      clearRequestHistory: () => {
        set({ requestHistory: [] });
      },

      updateConfig: (config: Partial<PermissionConfig>) => {
        set((state) => ({
          config: { ...state.config, ...config },
        }));
      },
    }),
    {
      name: 'permissions-store',
      partialize: (state) => ({
        config: {
          ...state.config,
          // Convert Maps to objects for serialization
          toolPermissions: Object.fromEntries(state.config.toolPermissions),
          rememberedChoices: Object.fromEntries(state.config.rememberedChoices),
        },
        toolPermissions: Object.fromEntries(state.toolPermissions),
        requestHistory: state.requestHistory.slice(-50), // Keep last 50
      }),
      // Deserialize Maps
      onRehydrateStorage: () => (state) => {
        if (state?.config) {
          state.config.toolPermissions = new Map(
            Object.entries((state.config as any).toolPermissions || {})
          );
          state.config.rememberedChoices = new Map(
            Object.entries((state.config as any).rememberedChoices || {})
          );
        }
        if (state?.toolPermissions) {
          state.toolPermissions = new Map(
            Object.entries(state.toolPermissions as any)
          );
        }
      },
    }
  )
);
