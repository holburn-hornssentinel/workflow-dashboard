import { NextRequest, NextResponse } from 'next/server';
import { getMCPClient } from '@/lib/mcp/client';
import {
  MCPCallRequestSchema,
  validateRequest,
  formatValidationError,
} from '@/lib/security/validators';
import { validateToolId } from '@/lib/security/sanitizer';
import { isDemoBlocked } from '@/lib/demo-mode';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body with Zod schema
    const validation = validateRequest(MCPCallRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json(formatValidationError(validation.error), {
        status: 400,
      });
    }

    const { toolId, args } = validation.data;

    // Additional validation for tool ID format
    if (!validateToolId(toolId)) {
      return NextResponse.json(
        { error: 'Invalid tool ID format. Expected format: server:tool' },
        { status: 400 }
      );
    }

    // Check if operation is blocked in demo mode
    if (isDemoBlocked(toolId)) {
      return NextResponse.json(
        { error: 'This operation is disabled in demo mode for safety.' },
        { status: 403 }
      );
    }

    const client = getMCPClient();

    // Validate args against tool's input schema if available
    const tools = await client.listTools();
    const tool = tools.find((t) => `${t.serverId}:${t.name}` === toolId);

    if (!tool) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    // If tool has input schema, validate args against it
    if (tool.inputSchema && args) {
      try {
        // Basic validation - could be enhanced with ajv or similar
        const requiredFields = tool.inputSchema.required || [];
        for (const field of requiredFields) {
          if (!(field in args)) {
            return NextResponse.json(
              { error: `Missing required field: ${field}` },
              { status: 400 }
            );
          }
        }
      } catch (schemaError) {
        console.error('[MCP] Schema validation error:', schemaError);
        return NextResponse.json(
          { error: 'Invalid arguments for tool' },
          { status: 400 }
        );
      }
    }

    const result = await client.callTool(toolId, args);

    return NextResponse.json({ result });
  } catch (error) {
    console.error('[MCP] Tool call error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Tool call failed',
      },
      { status: 500 }
    );
  }
}
