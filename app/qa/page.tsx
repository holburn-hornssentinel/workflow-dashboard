'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TestReport, TestResult } from '@/lib/qa/types';

export default function QAPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<TestReport | null>(null);

  const runTests = async () => {
    setIsRunning(true);
    setReport(null);

    try {
      const response = await fetch('/api/qa/run', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setReport(data);
      } else {
        console.error('Test execution failed');
      }
    } catch (error) {
      console.error('Failed to run tests:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'bg-green-500/20 text-green-400 border-green-500';
      case 'failed':
        return 'bg-red-500/20 text-red-400 border-red-500';
      case 'skipped':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'api':
        return '🔌';
      case 'ui':
        return '🎨';
      case 'integration':
        return '🔗';
      case 'e2e':
        return '🌐';
      default:
        return '📋';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-slate-400 hover:text-white transition-colors mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">🧪 QA Testing Dashboard</h1>
          <p className="text-slate-300">Automated testing and quality assurance</p>
        </div>

        {/* Run Tests Button */}
        <div className="mb-8">
          <button
            onClick={runTests}
            disabled={isRunning}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              isRunning
                ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
            }`}
          >
            {isRunning ? (
              <span className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Running Tests...
              </span>
            ) : (
              '▶️ Run All Tests'
            )}
          </button>
        </div>

        {/* Test Report */}
        {report && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <div className="text-slate-400 text-sm">Total Tests</div>
                <div className="text-3xl font-bold text-white">{report.totalTests}</div>
              </div>
              <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4">
                <div className="text-green-400 text-sm">Passed</div>
                <div className="text-3xl font-bold text-green-400">{report.passed}</div>
              </div>
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
                <div className="text-red-400 text-sm">Failed</div>
                <div className="text-3xl font-bold text-red-400">{report.failed}</div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
                <div className="text-blue-400 text-sm">Duration</div>
                <div className="text-3xl font-bold text-blue-400">
                  {(report.duration / 1000).toFixed(1)}s
                </div>
              </div>
            </div>

            {/* Coverage */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Coverage</h2>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">API Tests</span>
                    <span className="text-white font-medium">{report.coverage.api.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all"
                      style={{ width: `${report.coverage.api}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">Integration Tests</span>
                    <span className="text-white font-medium">
                      {report.coverage.integration.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 transition-all"
                      style={{ width: `${report.coverage.integration}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Test Results */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Test Results</h2>
              <div className="space-y-2">
                {report.results.map((result: TestResult) => (
                  <div
                    key={result.id}
                    className={`border rounded-lg p-4 ${getStatusColor(result.status)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span>{getCategoryIcon(result.category)}</span>
                          <span className="font-medium">{result.name}</span>
                          <span className="text-xs px-2 py-1 bg-slate-700/50 rounded">
                            {result.category}
                          </span>
                        </div>
                        {result.details && (
                          <p className="text-sm opacity-80 mt-1">{result.details}</p>
                        )}
                        {result.error && (
                          <p className="text-sm mt-2 bg-black/30 p-2 rounded font-mono">
                            {result.error}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-xs opacity-60">{result.duration}ms</div>
                        <div className="text-xs font-bold uppercase mt-1">{result.status}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!report && !isRunning && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">🧪</div>
            <h3 className="text-xl font-semibold text-white mb-2">No Tests Run Yet</h3>
            <p className="text-slate-400">
              Click "Run All Tests" to start automated quality assurance testing
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
