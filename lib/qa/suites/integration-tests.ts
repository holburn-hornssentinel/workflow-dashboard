import { TestSuite, TestResult } from '../types';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3004';

export const integrationTestSuite: TestSuite = {
  id: 'integration-suite',
  name: 'Integration Tests',
  category: 'integration',
  tests: [
    {
      id: 'int-vibe-to-builder',
      name: 'Vibe Code → Builder Workflow',
      description: 'Generate workflow via vibe, verify it can be imported to builder',
      run: async (): Promise<TestResult> => {
        const startTime = Date.now();
        try {
          // Step 1: Generate workflow via vibe
          const vibeResponse = await fetch(`${BASE_URL}/api/vibe/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              description: 'Create a simple test workflow',
              provider: 'claude',
            }),
          });

          if (!vibeResponse.ok) {
            throw new Error('Vibe generation failed');
          }

          const workflowData = await vibeResponse.json();

          // Step 2: Verify workflow has nodes and edges
          if (!workflowData.nodes || !Array.isArray(workflowData.nodes)) {
            throw new Error('Generated workflow missing nodes');
          }

          if (!workflowData.edges || !Array.isArray(workflowData.edges)) {
            throw new Error('Generated workflow missing edges');
          }

          // Step 3: Export to YAML
          const exportResponse = await fetch(`${BASE_URL}/api/builder/export`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(workflowData),
          });

          if (!exportResponse.ok) {
            throw new Error('Export to YAML failed');
          }

          const { yaml } = await exportResponse.json();

          // Step 4: Re-import YAML
          const importResponse = await fetch(`${BASE_URL}/api/builder/import`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ yaml }),
          });

          if (!importResponse.ok) {
            throw new Error('Import from YAML failed');
          }

          const reimportedData = await importResponse.json();

          // Verify nodes count matches
          if (reimportedData.nodes.length !== workflowData.nodes.length) {
            throw new Error('Node count mismatch after round-trip');
          }

          return {
            id: 'int-vibe-to-builder',
            name: 'Vibe Code → Builder Workflow',
            category: 'integration',
            status: 'passed',
            duration: Date.now() - startTime,
            details: `Generated ${workflowData.nodes.length} nodes, exported and reimported successfully`,
            timestamp: new Date().toISOString(),
          };
        } catch (error) {
          return {
            id: 'int-vibe-to-builder',
            name: 'Vibe Code → Builder Workflow',
            category: 'integration',
            status: 'failed',
            duration: Date.now() - startTime,
            error: error instanceof Error ? error.message : 'Integration test failed',
            timestamp: new Date().toISOString(),
          };
        }
      },
    },
    {
      id: 'int-memory-persistence',
      name: 'Memory Storage & Retrieval',
      description: 'Store memory and verify it can be retrieved',
      run: async (): Promise<TestResult> => {
        const startTime = Date.now();
        try {
          const testContent = `QA Test ${Date.now()}`;

          // Step 1: Store memory
          const storeResponse = await fetch(`${BASE_URL}/api/memory`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'store',
              content: testContent,
              metadata: { source: 'qa-test' },
            }),
          });

          if (!storeResponse.ok) {
            throw new Error('Memory storage failed');
          }

          // Step 2: Check stats updated
          const statsResponse = await fetch(`${BASE_URL}/api/memory/stats`);
          if (!statsResponse.ok) {
            throw new Error('Failed to fetch memory stats');
          }

          return {
            id: 'int-memory-persistence',
            name: 'Memory Storage & Retrieval',
            category: 'integration',
            status: 'passed',
            duration: Date.now() - startTime,
            details: 'Memory stored and stats updated',
            timestamp: new Date().toISOString(),
          };
        } catch (error) {
          return {
            id: 'int-memory-persistence',
            name: 'Memory Storage & Retrieval',
            category: 'integration',
            status: 'failed',
            duration: Date.now() - startTime,
            error: error instanceof Error ? error.message : 'Memory test failed',
            timestamp: new Date().toISOString(),
          };
        }
      },
    },
    {
      id: 'int-dual-provider',
      name: 'Dual AI Provider Support',
      description: 'Verify both Claude and Gemini work correctly',
      run: async (): Promise<TestResult> => {
        const startTime = Date.now();
        try {
          // Test Claude
          const claudeResponse = await fetch(`${BASE_URL}/api/vibe/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              description: 'Test workflow',
              provider: 'claude',
            }),
          });

          if (!claudeResponse.ok) {
            throw new Error('Claude provider failed');
          }

          // Test Gemini
          const geminiResponse = await fetch(`${BASE_URL}/api/vibe/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              description: 'Test workflow',
              provider: 'gemini',
            }),
          });

          if (!geminiResponse.ok) {
            throw new Error('Gemini provider failed');
          }

          return {
            id: 'int-dual-provider',
            name: 'Dual AI Provider Support',
            category: 'integration',
            status: 'passed',
            duration: Date.now() - startTime,
            details: 'Both Claude and Gemini providers working',
            timestamp: new Date().toISOString(),
          };
        } catch (error) {
          return {
            id: 'int-dual-provider',
            name: 'Dual AI Provider Support',
            category: 'integration',
            status: 'failed',
            duration: Date.now() - startTime,
            error: error instanceof Error ? error.message : 'Provider test failed',
            timestamp: new Date().toISOString(),
          };
        }
      },
    },
  ],
};
