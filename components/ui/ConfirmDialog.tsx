'use client';

/**
 * Reusable confirmation dialog component
 * Replaces browser confirm() with a styled modal
 */

import { AlertTriangle, Info, AlertCircle } from 'lucide-react';

export type ConfirmVariant = 'danger' | 'warning' | 'default';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  onConfirm: () => void;
  onCancel: () => void;
}

const VariantIcon = ({ variant }: { variant: ConfirmVariant }) => {
  switch (variant) {
    case 'danger':
      return <AlertTriangle className="h-6 w-6 text-red-400" />;
    case 'warning':
      return <AlertCircle className="h-6 w-6 text-yellow-400" />;
    case 'default':
      return <Info className="h-6 w-6 text-blue-400" />;
  }
};

const getVariantStyles = (variant: ConfirmVariant) => {
  switch (variant) {
    case 'danger':
      return {
        bg: 'bg-red-500/10 border-red-500/30',
        button: 'bg-red-600 hover:bg-red-700',
      };
    case 'warning':
      return {
        bg: 'bg-yellow-500/10 border-yellow-500/30',
        button: 'bg-yellow-600 hover:bg-yellow-700',
      };
    case 'default':
      return {
        bg: 'bg-blue-500/10 border-blue-500/30',
        button: 'bg-blue-600 hover:bg-blue-700',
      };
  }
};

export const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  if (!isOpen) return null;

  const styles = getVariantStyles(variant);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 border border-white/[0.06] rounded-lg shadow-2xl max-w-md w-full mx-4">
        {/* Header */}
        <div className={`flex items-center gap-3 p-6 border rounded-t-lg ${styles.bg}`}>
          <VariantIcon variant={variant} />
          <h2 className="text-lg font-medium text-white">{title}</h2>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-slate-300 leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t border-white/[0.06] bg-slate-800/50">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm font-medium active:scale-[0.98]"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium active:scale-[0.98] ${styles.button}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
