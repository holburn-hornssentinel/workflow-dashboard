'use client';

import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

interface StreamingTerminalProps {
  onStop?: () => void;
  isStreaming?: boolean;
}

export default function StreamingTerminal({
  onStop,
  isStreaming = false,
}: StreamingTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!terminalRef.current || initialized) return;

    // Initialize xterm.js
    const terminal = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1a1b26',
        foreground: '#a9b1d6',
        cursor: '#c0caf5',
        black: '#32344a',
        red: '#f7768e',
        green: '#9ece6a',
        yellow: '#e0af68',
        blue: '#7aa2f7',
        magenta: '#ad8ee6',
        cyan: '#449dab',
        white: '#787c99',
        brightBlack: '#444b6a',
        brightRed: '#ff7a93',
        brightGreen: '#b9f27c',
        brightYellow: '#ff9e64',
        brightBlue: '#7da6ff',
        brightMagenta: '#bb9af7',
        brightCyan: '#0db9d7',
        brightWhite: '#acb0d0',
      },
      scrollback: 10000,
      allowTransparency: true,
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    terminal.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = terminal;
    fitAddonRef.current = fitAddon;
    setInitialized(true);

    // Welcome message
    terminal.writeln('\x1b[1;36m╔═══════════════════════════════════════╗\x1b[0m');
    terminal.writeln('\x1b[1;36m║   Workflow Dashboard Execution Log   ║\x1b[0m');
    terminal.writeln('\x1b[1;36m╚═══════════════════════════════════════╝\x1b[0m');
    terminal.writeln('');

    // Handle resize
    const handleResize = () => {
      fitAddon.fit();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      terminal.dispose();
    };
  }, [initialized]);

  // Public method to write to terminal
  const write = (text: string) => {
    xtermRef.current?.write(text);
  };

  const writeln = (text: string) => {
    xtermRef.current?.writeln(text);
  };

  const clear = () => {
    xtermRef.current?.clear();
  };

  // Expose methods via ref
  useEffect(() => {
    if (terminalRef.current && xtermRef.current) {
      (terminalRef.current as any).terminal = {
        write,
        writeln,
        clear,
      };
    }
  }, [initialized]);

  return (
    <div className="flex flex-col h-full bg-[#1a1b26] rounded-lg overflow-hidden border border-gray-700">
      {/* Terminal header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#16161e] border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span className="text-sm text-gray-400 ml-2">
            {isStreaming ? (
              <span className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Streaming...
              </span>
            ) : (
              'Ready'
            )}
          </span>
        </div>
        {isStreaming && onStop && (
          <button
            onClick={onStop}
            className="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded transition-colors active:scale-[0.98]"
          >
            Stop
          </button>
        )}
      </div>

      {/* Terminal body */}
      <div ref={terminalRef} className="flex-1 p-2" />
    </div>
  );
}

// Helper function to format log levels
export const formatLog = {
  info: (msg: string) => `\x1b[36mℹ\x1b[0m ${msg}`,
  success: (msg: string) => `\x1b[32m✓\x1b[0m ${msg}`,
  warning: (msg: string) => `\x1b[33m⚠\x1b[0m ${msg}`,
  error: (msg: string) => `\x1b[31m✗\x1b[0m ${msg}`,
  step: (num: number, total: number, msg: string) =>
    `\x1b[1;35m[${num}/${total}]\x1b[0m ${msg}`,
  tool: (name: string) => `\x1b[1;34m🔧 ${name}\x1b[0m`,
  thinking: () => `\x1b[90m💭 Thinking...\x1b[0m`,
  separator: () => `\x1b[90m${'─'.repeat(50)}\x1b[0m`,
};
