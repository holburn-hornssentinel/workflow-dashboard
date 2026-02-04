import { TestSuite, TestResult } from '../types';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3004';

async function testEndpoint(
  name: string,
  method: string,
  endpoint: string,
  body?: any,
  expectedStatus: number = 200
): Promise<TestResult> {
  const startTime = Date.now();
  try {
    const options: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const duration = Date.now() - startTime;

    if (response.status === expectedStatus) {
      return {
        id: `api-${name}`,
        name,
        category: 'api',
        status: 'passed',
        duration,
        details: `${method} ${endpoint} returned ${response.status}`,
        timestamp: new Date().toISOString(),
      };
    } else {
      return {
        id: `api-${name}`,
        name,
        category: 'api',
        status: 'failed',
        duration,
        error: `Expected ${expectedStatus}, got ${response.status}`,
        timestamp: new Date().toISOString(),
      };
    }
  } catch (error) {
    return {
      id: `api-${name}`,
      name,
      category: 'api',
      status: 'failed',
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Request failed',
      timestamp: new Date().toISOString(),
    };
  }
}

export const apiTestSuite: TestSuite = {
  id: 'api-suite',
  name: 'API Endpoints',
  category: 'api',
  tests: [
    {
      id: 'api-settings-get',
      name: 'GET /api/settings/env',
      description: 'Verify settings endpoint returns configuration',
      run: () => testEndpoint('Settings GET', 'GET', '/api/settings/env'),
    },
    {
      id: 'api-agents-list',
      name: 'GET /api/agents',
      description: 'Verify agents endpoint returns agent list',
      run: () => testEndpoint('Agents List', 'GET', '/api/agents'),
    },
    {
      id: 'api-memory-stats',
      name: 'GET /api/memory/stats',
      description: 'Verify memory stats endpoint',
      run: () => testEndpoint('Memory Stats', 'GET', '/api/memory/stats'),
    },
    {
      id: 'api-vibe-claude',
      name: 'POST /api/vibe/generate (Claude)',
      description: 'Verify workflow generation with Claude',
      run: () =>
        testEndpoint('Vibe Generate Claude', 'POST', '/api/vibe/generate', {
          description: 'Create a simple greeting agent',
          provider: 'claude',
        }),
    },
    {
      id: 'api-vibe-gemini',
      name: 'POST /api/vibe/generate (Gemini)',
      description: 'Verify workflow generation with Gemini',
      run: () =>
        testEndpoint('Vibe Generate Gemini', 'POST', '/api/vibe/generate', {
          description: 'Create a simple greeting agent',
          provider: 'gemini',
        }),
    },
    {
      id: 'api-builder-export',
      name: 'POST /api/builder/export',
      description: 'Verify workflow export to YAML',
      run: () =>
        testEndpoint('Builder Export', 'POST', '/api/builder/export', {
          nodes: [
            {
              id: '1',
              type: 'custom',
              position: { x: 100, y: 100 },
              data: { label: 'Test', type: 'agent' },
            },
          ],
          edges: [],
        }),
    },
    {
      id: 'api-builder-import',
      name: 'POST /api/builder/import',
      description: 'Verify workflow import from YAML',
      run: () =>
        testEndpoint('Builder Import', 'POST', '/api/builder/import', {
          yaml: 'name: Test\nsteps:\n  step1:\n    name: Agent\n    prompt: test',
        }),
    },
    {
      id: 'api-stream',
      name: 'POST /api/agents/stream',
      description: 'Verify streaming endpoint',
      run: async () => {
        const startTime = Date.now();
        try {
          const response = await fetch(`${BASE_URL}/api/agents/stream`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: 'Say hi',
              provider: 'claude',
            }),
          });

          if (response.ok && response.body) {
            return {
              id: 'api-stream',
              name: 'Streaming API',
              category: 'api',
              status: 'passed',
              duration: Date.now() - startTime,
              details: 'Streaming endpoint responding',
              timestamp: new Date().toISOString(),
            };
          } else {
            return {
              id: 'api-stream',
              name: 'Streaming API',
              category: 'api',
              status: 'failed',
              duration: Date.now() - startTime,
              error: 'No stream body received',
              timestamp: new Date().toISOString(),
            };
          }
        } catch (error) {
          return {
            id: 'api-stream',
            name: 'Streaming API',
            category: 'api',
            status: 'failed',
            duration: Date.now() - startTime,
            error: error instanceof Error ? error.message : 'Stream failed',
            timestamp: new Date().toISOString(),
          };
        }
      },
    },
  ],
};
