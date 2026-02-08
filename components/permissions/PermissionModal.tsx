'use client';

import { useState } from 'react';
import { AlertTriangle, Shield, X, Clock } from 'lucide-react';
import { usePermissionsStore } from '@/stores/permissionsStore';
import type { PermissionRequest } from '@/types/permissions';
import {
  assessToolRisk,
  getRiskColor,
  getRiskBgColor,
} from '@/types/permissions';

interface PermissionModalProps {
  request: PermissionRequest;
  onClose: () => void;
}

export function PermissionModal({ request, onClose }: PermissionModalProps) {
  const { approveRequest, denyRequest } = usePermissionsStore();
  const [reason, setReason] = useState('');
  const [rememberChoice, setRememberChoice] = useState(false);

  // Assess risk
  const riskAssessment = request.toolId
    ? assessToolRisk(request.toolId, request.details)
    : { level: 'medium' as const, reasons: ['Unknown risk'], mitigations: [] };

  const handleApprove = () => {
    approveRequest(request.id, reason || undefined, rememberChoice);
    onClose();
  };

  const handleDeny = () => {
    denyRequest(request.id, reason || 'User denied', rememberChoice);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 border border-white/[0.06] rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-blue-400" />
            <h2 className="text-base font-medium text-white">Permission Required</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors active:scale-[0.98]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Risk Level */}
          <div
            className={`p-4 border rounded-lg ${getRiskBgColor(riskAssessment.level)}`}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className={`w-5 h-5 ${getRiskColor(riskAssessment.level)} flex-shrink-0 mt-0.5`} />
              <div>
                <p className="font-semibold text-white mb-1">
                  Risk Level:{' '}
                  <span className={getRiskColor(riskAssessment.level)}>
                    {riskAssessment.level.toUpperCase()}
                  </span>
                </p>
                <ul className="text-sm text-gray-300 space-y-1">
                  {riskAssessment.reasons.map((reason, i) => (
                    <li key={i}>• {reason}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Request Details */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Operation Details
            </h3>
            <div className="space-y-2">
              <div className="flex items-start justify-between p-3 bg-slate-700/30 rounded-lg">
                <span className="text-sm text-gray-400">Type:</span>
                <span className="text-sm font-medium text-white">
                  {request.type}
                </span>
              </div>

              {request.toolId && (
                <div className="flex items-start justify-between p-3 bg-slate-700/30 rounded-lg">
                  <span className="text-sm text-gray-400">Tool:</span>
                  <span className="text-sm font-mono font-medium text-blue-400">
                    {request.toolId}
                  </span>
                </div>
              )}

              {Object.keys(request.details).length > 0 && (
                <div className="p-3 bg-slate-700/30 rounded-lg">
                  <p className="text-sm text-gray-400 mb-2">Arguments:</p>
                  <pre className="text-xs font-mono text-gray-300 overflow-x-auto">
                    {JSON.stringify(request.details, null, 2)}
                  </pre>
                </div>
              )}

              <div className="flex items-start justify-between p-3 bg-slate-700/30 rounded-lg">
                <span className="text-sm text-gray-400">Requested:</span>
                <span className="text-sm text-gray-300">
                  {new Date(request.requestedAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Mitigations */}
          {riskAssessment.mitigations.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Safety Checklist
              </h3>
              <ul className="space-y-2">
                {riskAssessment.mitigations.map((mitigation, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-yellow-400 mt-0.5">⚠</span>
                    {mitigation}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Optional Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Reason (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why are you approving/denying this request?"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
            />
          </div>

          {/* Remember Choice */}
          <div className="flex items-center gap-2 p-3 bg-slate-700/30 rounded-lg">
            <input
              type="checkbox"
              id="remember"
              checked={rememberChoice}
              onChange={(e) => setRememberChoice(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="remember" className="text-sm text-gray-300 cursor-pointer">
              Remember this choice for{' '}
              <span className="font-mono text-blue-400">{request.toolId}</span>
            </label>
          </div>

          {/* Timeout Warning */}
          <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <Clock className="w-4 h-4 text-yellow-400" />
            <p className="text-xs text-yellow-300">
              This request will auto-deny in 30 seconds if not approved.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t border-white/[0.06] bg-slate-800/50">
          <button
            onClick={handleDeny}
            className="flex-1 px-4 py-3 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg transition-colors text-sm font-medium active:scale-[0.98]"
          >
            Deny
          </button>
          <button
            onClick={handleApprove}
            className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium active:scale-[0.98]"
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}
