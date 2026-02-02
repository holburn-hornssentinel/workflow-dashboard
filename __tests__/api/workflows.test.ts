import { GET } from '@/app/api/workflows/[name]/route';
import { NextRequest } from 'next/server';

describe('GET /api/workflows/[name]', () => {
  it('should return workflow data for valid workflow name', async () => {
    const mockParams = Promise.resolve({ name: 'bug-fix-workflow' });
    const request = new NextRequest('http://localhost:3000/api/workflows/bug-fix-workflow');

    const response = await GET(request, { params: mockParams });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('workflow');
    expect(data).toHaveProperty('nodes');
    expect(data).toHaveProperty('edges');
    expect(data.workflow.name).toContain('Bug Fix');
    expect(Array.isArray(data.nodes)).toBe(true);
    expect(Array.isArray(data.edges)).toBe(true);
  });

  it('should return 404 for non-existent workflow', async () => {
    const mockParams = Promise.resolve({ name: 'non-existent-workflow-xyz' });
    const request = new NextRequest('http://localhost:3000/api/workflows/non-existent-workflow-xyz');

    const response = await GET(request, { params: mockParams });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Workflow not found');
  });

  it('should handle URL-encoded workflow names', async () => {
    const encodedName = encodeURIComponent('bug-fix-workflow');
    const mockParams = Promise.resolve({ name: encodedName });
    const request = new NextRequest(`http://localhost:3000/api/workflows/${encodedName}`);

    const response = await GET(request, { params: mockParams });

    expect(response.status).toBe(200);
  });

  it('should return nodes with proper structure', async () => {
    const mockParams = Promise.resolve({ name: 'bug-fix-workflow' });
    const request = new NextRequest('http://localhost:3000/api/workflows/bug-fix-workflow');

    const response = await GET(request, { params: mockParams });
    const data = await response.json();

    expect(data.nodes.length).toBeGreaterThan(0);

    // Check first node structure
    const firstNode = data.nodes[0];
    expect(firstNode).toHaveProperty('id');
    expect(firstNode).toHaveProperty('type');
    expect(firstNode).toHaveProperty('position');
    expect(firstNode).toHaveProperty('data');
    expect(firstNode.type).toBe('workflowStep');
    expect(firstNode.position).toHaveProperty('x');
    expect(firstNode.position).toHaveProperty('y');
    expect(firstNode.data).toHaveProperty('label');
  });

  it('should return edges connecting steps sequentially', async () => {
    const mockParams = Promise.resolve({ name: 'bug-fix-workflow' });
    const request = new NextRequest('http://localhost:3000/api/workflows/bug-fix-workflow');

    const response = await GET(request, { params: mockParams });
    const data = await response.json();

    if (data.edges.length > 0) {
      const firstEdge = data.edges[0];
      expect(firstEdge).toHaveProperty('id');
      expect(firstEdge).toHaveProperty('source');
      expect(firstEdge).toHaveProperty('target');
      expect(firstEdge.type).toBe('smoothstep');
    }
  });
});
