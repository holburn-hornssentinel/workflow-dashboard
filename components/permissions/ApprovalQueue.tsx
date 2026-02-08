'use client';

import { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { usePermissionsStore } from '@/stores/permissionsStore';
import { PermissionModal } from './PermissionModal';
import { assessToolRisk, getRiskColor } from '@/types/permissions';

export function ApprovalQueue() {
  const {
    pendingRequests,
    requestHistory,
    approveRequest,
    denyRequest,
    clearPendingRequests,
    clearRequestHistory,
  } = usePermissionsStore();

  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<Record<string, number>>({});

  // Update countdown timers
  useEffect(() => {
    const interval = setInterval(() => {
      const newTimeRemaining: Record<string, number> = {};

      for (const request of pendingRequests) {
        const elapsed = Date.now() - new Date(request.requestedAt).getTime();
        const remaining = Math.max(0, 30000 - elapsed); // 30 second timeout
        newTimeRemaining[request.id] = Math.ceil(remaining / 1000);
      }

      setTimeRemaining(newTimeRemaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [pendingRequests]);

  const selectedRequestData = pendingRequests.find((r) => r.id === selectedRequest);

  const handleQuickApprove = (requestId: string) => {
    approveRequest(requestId);
  };

  const handleQuickDeny = (requestId: string) => {
    denyRequest(requestId, 'Quick deny');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-white flex items-center gap-2">
          <Shield className="w-6 h-6" />
          Approval Queue
        </h2>
        {pendingRequests.length > 0 && (
          <button
            onClick={clearPendingRequests}
            className="px-3 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg transition-colors text-sm active:scale-[0.98]"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Pending Requests */}
      <div className="bg-slate-800/50 border border-white/[0.06] rounded-lg p-4">
        <h3 className="text-base font-medium text-white mb-4">
          Pending Approvals ({pendingRequests.length})
        </h3>

        {pendingRequests.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No pending approval requests</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((request) => {
              const riskAssessment = request.toolId
                ? assessToolRisk(request.toolId, request.details)
                : { level: 'medium' as const, reasons: [] };

              const timeLeft = timeRemaining[request.id] || 0;

              return (
                <div
                  key={request.id}
                  className="p-4 bg-slate-700/30 border border-slate-600 rounded-lg hover:border-slate-500 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${
                            riskAssessment.level === 'critical'
                              ? 'bg-red-500/20 text-red-400'
                              : riskAssessment.level === 'high'
                                ? 'bg-orange-500/20 text-orange-400'
                                : riskAssessment.level === 'medium'
                                  ? 'bg-yellow-500/20 text-yellow-400'
                                  : 'bg-green-500/20 text-green-400'
                          }`}
                        >
                          {riskAssessment.level.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-400">{request.type}</span>
                      </div>

                      {request.toolId && (
                        <p className="font-mono text-sm text-blue-400 mb-1">
                          {request.toolId}
                        </p>
                      )}

                      <p className="text-xs text-gray-400">
                        Requested {new Date(request.requestedAt).toLocaleTimeString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span
                        className={timeLeft <= 10 ? 'text-red-400 font-semibold' : ''}
                      >
                        {timeLeft}s
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedRequest(request.id)}
                      className="flex-1 px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors text-sm"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleQuickApprove(request.id)}
                      className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-1"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleQuickDeny(request.id)}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-1"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Request History */}
      <div className="bg-slate-800/50 border border-white/[0.06] rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium text-white">
            Recent History ({requestHistory.slice(-10).length})
          </h3>
          {requestHistory.length > 0 && (
            <button
              onClick={clearRequestHistory}
              className="px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors active:scale-[0.98]"
            >
              Clear History
            </button>
          )}
        </div>

        {requestHistory.length === 0 ? (
          <p className="text-center py-8 text-gray-400 text-sm">No history yet</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {requestHistory
              .slice()
              .reverse()
              .slice(0, 10)
              .map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 bg-slate-700/20 rounded-lg"
                >
                  <div className="flex-1">
                    {request.toolId && (
                      <p className="font-mono text-xs text-gray-300">
                        {request.toolId}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {request.respondedAt
                        ? new Date(request.respondedAt).toLocaleString()
                        : new Date(request.requestedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {request.status === 'approved' ? (
                      <div className="flex items-center gap-1 text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs font-medium">Approved</span>
                      </div>
                    ) : request.status === 'denied' ? (
                      <div className="flex items-center gap-1 text-red-400">
                        <XCircle className="w-4 h-4" />
                        <span className="text-xs font-medium">Denied</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-yellow-400">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs font-medium">Timeout</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Permission Modal */}
      {selectedRequest && selectedRequestData && (
        <PermissionModal
          request={selectedRequestData}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </div>
  );
}
