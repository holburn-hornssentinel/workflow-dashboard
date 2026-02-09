import { useCallback, useRef } from 'react';
import { useWorkflowStore } from '@/stores/workflowStore';
import { formatLog, StreamingTerminalHandle } from '@/components/execution/StreamingTerminal';

interface StreamExecutionOptions {
  prompt: string;
  model?: string;
  systemPrompt?: string;
  tools?: any[];
  onChunk?: (chunk: any) => void;
  terminalRef?: React.RefObject<StreamingTerminalHandle>;
}

export function useStreamingExecution() {
  const {
    startStreaming,
    addStreamingChunk,
    stopStreaming,
    abortStreaming,
    streaming,
  } = useWorkflowStore();

  const abortControllerRef = useRef<AbortController | null>(null);

  const getTerminal = (terminalRef?: React.RefObject<StreamingTerminalHandle>) => {
    if (terminalRef?.current) {
      return terminalRef.current.terminal;
    }
    return null;
  };

  const streamExecution = useCallback(
    async (stepKey: string, options: StreamExecutionOptions) => {
      const { prompt, model, systemPrompt, tools, onChunk, terminalRef } = options;

      const terminal = getTerminal(terminalRef);

      try {
        // Create abort controller
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        // Start streaming
        startStreaming(stepKey, abortController);

        if (terminal) {
          terminal.writeln(formatLog.separator());
          terminal.writeln(formatLog.info(`Starting execution for ${stepKey}...`));
          terminal.writeln(formatLog.separator());
        }

        // Detect provider from model name
        const provider = model?.startsWith('gemini') ? 'gemini' : 'claude';

        // Call streaming API
        const response = await fetch('/api/agents/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, model, systemPrompt, tools, provider }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`Stream failed: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('No response body');
        }

        let buffer = '';
        let currentText = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim() || !line.startsWith('data: ')) continue;

            const data = line.slice(6); // Remove 'data: ' prefix

            if (data === '[DONE]') {
              if (terminal) {
                terminal.writeln('');
                terminal.writeln(formatLog.success('Execution completed'));
                terminal.writeln(formatLog.separator());
              }
              stopStreaming();
              return;
            }

            try {
              const chunk = JSON.parse(data);

              // Handle error chunks
              if (chunk.type === 'error') {
                if (terminal) {
                  terminal.writeln(formatLog.error(chunk.error));
                }
                throw new Error(chunk.error);
              }

              // Handle content chunks
              if (chunk.type === 'content_block_delta') {
                if (chunk.delta?.type === 'text_delta') {
                  const text = chunk.delta.text;
                  currentText += text;
                  addStreamingChunk(text);

                  if (terminal) {
                    terminal.write(text);
                  }

                  if (onChunk) {
                    onChunk(chunk);
                  }
                }
              }

              // Handle tool use
              if (chunk.type === 'content_block_start') {
                if (chunk.content_block?.type === 'tool_use') {
                  const toolName = chunk.content_block.name;
                  if (terminal) {
                    terminal.writeln('');
                    terminal.writeln(formatLog.tool(toolName));
                  }
                }
              }

              // Handle message start
              if (chunk.type === 'message_start') {
                if (terminal) {
                  terminal.writeln(formatLog.thinking());
                }
              }
            } catch (parseError) {
              console.error('[Stream] Parse error:', parseError);
            }
          }
        }

        stopStreaming();
      } catch (error) {
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            if (terminal) {
              terminal.writeln('');
              terminal.writeln(formatLog.warning('Execution aborted'));
              terminal.writeln(formatLog.separator());
            }
            stopStreaming();
          } else {
            if (terminal) {
              terminal.writeln(formatLog.error(error.message));
            }
            stopStreaming(error.message);
          }
        }
        throw error;
      } finally {
        abortControllerRef.current = null;
      }
    },
    [startStreaming, addStreamingChunk, stopStreaming]
  );

  const abort = useCallback(() => {
    abortStreaming();
  }, [abortStreaming]);

  return {
    streamExecution,
    abort,
    isStreaming: streaming.isStreaming,
    streamingStepKey: streaming.streamingStepKey,
    streamingChunks: streaming.streamingChunks,
    streamingError: streaming.streamingError,
  };
}
