'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800/50 border border-white/[0.06] rounded-lg p-8">
        <h2 className="text-2xl font-bold text-white mb-4">Something went wrong</h2>
        <p className="text-slate-400 mb-6">
          An unexpected error occurred. Please try again or return to the home page.
        </p>
        <div className="flex gap-4">
          <button
            onClick={reset}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors text-center"
          >
            Go Home
          </Link>
        </div>
        {error.digest && (
          <p className="mt-4 text-xs text-slate-500">Error ID: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
