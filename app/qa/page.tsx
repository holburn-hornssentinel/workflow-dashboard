'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Tabs } from '@/components/ui/Tabs';
import StreamingTerminal, { StreamingTerminalHandle } from '@/components/execution/StreamingTerminal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { FlaskConical, Play, Square, Image, Settings2, CheckCircle, XCircle, AlertCircle, ChevronLeft } from 'lucide-react';

interface TestResult {
  name: string;
  passed: boolean | null;
  details: string;
  timestamp: string;
}

interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  success_rate: number;
}

interface Screenshot {
  filename: string;
  timestamp: number;
  size: number;
}

export default function QAPage() {
  const terminalRef = useRef<StreamingTerminalHandle>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [summary, setSummary] = useState<TestSummary | null>(null);
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Configuration
  const [targetUrl, setTargetUrl] = useState('');
  const [headless, setHeadless] = useState(true);
  const [geminiConfigured, setGeminiConfigured] = useState(false);

  // Load configuration on mount
  useEffect(() => {
    const host = window.location.hostname;
    const port = window.location.port || '3004';
    setTargetUrl(`http://${host}:${port}`);
    checkGeminiConfig();
    loadResults();
  }, []);

  const checkGeminiConfig = async () => {
    try {
      const response = await fetch('/api/settings/env');
      const data = await response.json();
      setGeminiConfigured(data.hasGeminiKey);
    } catch {
      setGeminiConfigured(false);
    }
  };

  const loadResults = async () => {
    try {
      const response = await fetch('/api/qa/results');
      const data = await response.json();
      if (data.screenshots) {
        setScreenshots(data.screenshots);
      }
      if (data.lastRun) {
        setTestResults(data.lastRun.results || []);
        setSummary(data.lastRun.summary || null);
      }
    } catch (error) {
      console.error('Failed to load results:', error);
    }
  };

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    setSummary(null);
    terminalRef.current?.terminal.clear();

    const controller = new AbortController();
    setAbortController(controller);

    try {
      const response = await fetch('/api/qa/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl, headless }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = await response.json();
        terminalRef.current?.terminal.writeln(`\x1b[31mError: ${error.error}\x1b[0m`);
        setIsRunning(false);
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          const data = line.slice(6);
          if (!data) continue;

          try {
            const event = JSON.parse(data);

            switch (event.type) {
              case 'start':
                terminalRef.current?.terminal.writeln(
                  `\x1b[1;36m╔═══════════════════════════════════════╗\x1b[0m`
                );
                terminalRef.current?.terminal.writeln(
                  `\x1b[1;36m║   QA Test Agent - Starting Tests     ║\x1b[0m`
                );
                terminalRef.current?.terminal.writeln(
                  `\x1b[1;36m╚═══════════════════════════════════════╝\x1b[0m`
                );
                terminalRef.current?.terminal.writeln(
                  `Target: ${event.url}`
                );
                terminalRef.current?.terminal.writeln(
                  `AI Validation: ${event.ai_enabled ? 'Enabled' : 'Disabled'}`
                );
                terminalRef.current?.terminal.writeln('');
                break;

              case 'discovery':
                if (event.phase === 'platform') {
                  terminalRef.current?.terminal.writeln(
                    `\x1b[36mPlatform: ${event.platform}\x1b[0m`
                  );
                } else if (event.phase === 'pages') {
                  terminalRef.current?.terminal.writeln(
                    `\x1b[36mDiscovered ${event.count} pages\x1b[0m`
                  );
                  terminalRef.current?.terminal.writeln('');
                }
                break;

              case 'result':
                const result: TestResult = {
                  name: event.name,
                  passed: event.passed,
                  details: event.details,
                  timestamp: event.timestamp,
                };
                setTestResults(prev => [...prev, result]);

                const icon = event.passed === true ? '✓' : event.passed === false ? '✗' : '⚠';
                const color = event.passed === true ? '32' : event.passed === false ? '31' : '33';
                terminalRef.current?.terminal.writeln(
                  `\x1b[${color}m${icon}\x1b[0m ${event.name}`
                );
                if (event.details) {
                  terminalRef.current?.terminal.writeln(
                    `  └─ ${event.details}`
                  );
                }
                break;

              case 'screenshot':
                terminalRef.current?.terminal.writeln(
                  `\x1b[36m📸 Screenshot: ${event.path}\x1b[0m`
                );
                break;

              case 'summary':
                setSummary({
                  total: event.total,
                  passed: event.passed,
                  failed: event.failed,
                  skipped: event.skipped,
                  success_rate: event.success_rate,
                });
                terminalRef.current?.terminal.writeln('');
                terminalRef.current?.terminal.writeln(
                  `\x1b[1;36m═══════ TEST SUMMARY ═══════\x1b[0m`
                );
                terminalRef.current?.terminal.writeln(
                  `Total:   ${event.total}`
                );
                terminalRef.current?.terminal.writeln(
                  `\x1b[32mPassed:  ${event.passed}\x1b[0m`
                );
                terminalRef.current?.terminal.writeln(
                  `\x1b[31mFailed:  ${event.failed}\x1b[0m`
                );
                terminalRef.current?.terminal.writeln(
                  `\x1b[33mSkipped: ${event.skipped}\x1b[0m`
                );
                terminalRef.current?.terminal.writeln(
                  `Success Rate: ${event.success_rate}%`
                );
                break;

              case 'log':
                if (event.level === 'stderr') {
                  terminalRef.current?.terminal.writeln(
                    `\x1b[90m${event.text}\x1b[0m`
                  );
                } else {
                  terminalRef.current?.terminal.writeln(event.text);
                }
                break;

              case 'done':
                terminalRef.current?.terminal.writeln('');
                terminalRef.current?.terminal.writeln(
                  `\x1b[1;36mTests completed (exit code: ${event.exitCode})\x1b[0m`
                );
                setIsRunning(false);
                setAbortController(null);
                // Reload screenshots
                loadResults();
                break;

              case 'error':
                terminalRef.current?.terminal.writeln(
                  `\x1b[31mError: ${event.message}\x1b[0m`
                );
                setIsRunning(false);
                setAbortController(null);
                break;
            }
          } catch (e) {
            console.error('Failed to parse SSE event:', e);
          }
        }
      }
    } catch (error: unknown) {
      if ((error as Error).name === 'AbortError') {
        terminalRef.current?.terminal.writeln('\x1b[33mTests aborted by user\x1b[0m');
      } else {
        terminalRef.current?.terminal.writeln(
          `\x1b[31mError: ${(error as Error).message}\x1b[0m`
        );
      }
      setIsRunning(false);
      setAbortController(null);
    }
  };

  const stopTests = () => {
    if (abortController) {
      abortController.abort();
      setIsRunning(false);
      setAbortController(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/"
            className="text-slate-400 hover:text-white transition-colors mb-4 inline-flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white mb-2 flex items-center gap-2">
                <FlaskConical className="h-6 w-6" /> QA Test Agent
              </h1>
              <p className="text-slate-300">
                Automated UI testing with Playwright and Gemini Vision AI
              </p>
            </div>
            <button
              onClick={isRunning ? stopTests : runTests}
              disabled={!targetUrl}
              className={`px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors active:scale-[0.98] flex items-center gap-2 ${
                isRunning
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700 disabled:bg-slate-600'
              }`}
            >
              {isRunning ? (
                <>
                  <Square className="h-4 w-4" /> Stop Tests
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" /> Run Tests
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          tabs={[
            {
              id: 'run',
              label: 'Run Tests',
              icon: <Play className="h-4 w-4" />,
              content: (
                <div className="space-y-4">
                  {/* Terminal */}
                  <div className="h-96">
                    <StreamingTerminal
                      ref={terminalRef}
                      isStreaming={isRunning}
                      onStop={stopTests}
                    />
                  </div>

                  {/* Test Results */}
                  {testResults.length > 0 && (
                    <div>
                      <h2 className="text-lg font-medium text-white mb-4">Test Results</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {testResults.map((result, index) => (
                          <div
                            key={index}
                            className={`bg-slate-800/50 backdrop-blur border rounded-lg p-4 ${
                              result.passed === true
                                ? 'border-green-500/30'
                                : result.passed === false
                                ? 'border-red-500/30'
                                : 'border-yellow-500/30'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {result.passed === true ? (
                                <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                              ) : result.passed === false ? (
                                <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                              ) : (
                                <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                              )}
                              <div className="flex-1 min-w-0">
                                <h3 className="text-white font-medium text-sm mb-1">
                                  {result.name}
                                </h3>
                                {result.details && (
                                  <p className="text-slate-400 text-xs break-words">
                                    {result.details}
                                  </p>
                                )}
                                <p className="text-slate-500 text-xs mt-1">
                                  {new Date(result.timestamp).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Summary Bar */}
                      {summary && (
                        <div className="mt-4 bg-slate-800/50 backdrop-blur border border-white/[0.06] rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex gap-6">
                              <div>
                                <span className="text-slate-400 text-sm">Total</span>
                                <p className="text-white text-xl font-semibold">{summary.total}</p>
                              </div>
                              <div>
                                <span className="text-green-400 text-sm">Passed</span>
                                <p className="text-white text-xl font-semibold">{summary.passed}</p>
                              </div>
                              <div>
                                <span className="text-red-400 text-sm">Failed</span>
                                <p className="text-white text-xl font-semibold">{summary.failed}</p>
                              </div>
                              <div>
                                <span className="text-yellow-400 text-sm">Skipped</span>
                                <p className="text-white text-xl font-semibold">{summary.skipped}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-slate-400 text-sm">Success Rate</span>
                              <p className={`text-3xl font-bold ${
                                summary.success_rate >= 80 ? 'text-green-400' :
                                summary.success_rate >= 60 ? 'text-yellow-400' :
                                'text-red-400'
                              }`}>
                                {summary.success_rate}%
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ),
            },
            {
              id: 'screenshots',
              label: 'Screenshots',
              icon: <Image className="h-4 w-4" />,
              content: (
                <div>
                  {screenshots.length === 0 ? (
                    <div className="text-center py-12">
                      <Image className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                      <p className="text-slate-400">No screenshots yet. Run tests to capture screenshots.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {screenshots.map((screenshot) => (
                        <div
                          key={screenshot.filename}
                          className="bg-slate-800/50 backdrop-blur border border-white/[0.06] rounded-lg p-2 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200 cursor-pointer"
                          onClick={() => setSelectedImage(screenshot.filename)}
                        >
                          <img
                            src={`/api/qa/screenshots/${screenshot.filename}`}
                            alt={screenshot.filename}
                            className="w-full h-32 object-cover rounded mb-2"
                          />
                          <p className="text-white text-xs font-medium truncate">
                            {screenshot.filename.replace(/\.png$/, '')}
                          </p>
                          <p className="text-slate-500 text-xs">
                            {new Date(screenshot.timestamp).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Full-size Image Modal */}
                  {selectedImage && (
                    <div
                      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6"
                      onClick={() => setSelectedImage(null)}
                    >
                      <div className="max-w-5xl max-h-full">
                        <img
                          src={`/api/qa/screenshots/${selectedImage}`}
                          alt={selectedImage}
                          className="max-w-full max-h-full rounded-lg shadow-2xl"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ),
            },
            {
              id: 'config',
              label: 'Configuration',
              icon: <Settings2 className="h-4 w-4" />,
              content: (
                <div className="max-w-2xl">
                  <div className="bg-slate-800/50 backdrop-blur border border-white/[0.06] rounded-lg p-6 space-y-6">
                    {/* Target URL */}
                    <div>
                      <label className="text-white font-medium block mb-2">
                        Target URL
                      </label>
                      <input
                        type="text"
                        value={targetUrl}
                        onChange={(e) => setTargetUrl(e.target.value)}
                        placeholder="http://localhost:3004"
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                      <p className="text-slate-500 text-sm mt-1">
                        The URL where the application is running
                      </p>
                    </div>

                    {/* Headless Mode */}
                    <div>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={headless}
                          onChange={(e) => setHeadless(e.target.checked)}
                          className="w-5 h-5 rounded border-slate-600 bg-slate-900 text-blue-500 focus:ring-blue-500"
                        />
                        <div>
                          <span className="text-white font-medium">Headless Mode</span>
                          <p className="text-slate-500 text-sm">
                            Run browser in the background (faster, no UI)
                          </p>
                        </div>
                      </label>
                    </div>

                    {/* AI Validation Status */}
                    <div className="border-t border-white/[0.06] pt-6">
                      <h3 className="text-white font-medium mb-3">AI Validation</h3>
                      <div className={`flex items-center gap-2 px-4 py-3 rounded-lg ${
                        geminiConfigured
                          ? 'bg-green-500/10 border border-green-500/30'
                          : 'bg-yellow-500/10 border border-yellow-500/30'
                      }`}>
                        {geminiConfigured ? (
                          <>
                            <CheckCircle className="h-5 w-5 text-green-400" />
                            <span className="text-green-400 text-sm">
                              Gemini API configured - AI validation enabled
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-5 w-5 text-yellow-400" />
                            <span className="text-yellow-400 text-sm">
                              Gemini API not configured - tests will run without AI validation
                            </span>
                          </>
                        )}
                      </div>
                      {!geminiConfigured && (
                        <p className="text-slate-400 text-sm mt-2">
                          Configure your Gemini API key in{' '}
                          <Link href="/settings" className="text-blue-400 hover:underline">
                            Settings
                          </Link>
                          {' '}to enable intelligent UI validation.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ),
            },
          ]}
          defaultTab="run"
        />
      </div>
    </div>
  );
}
