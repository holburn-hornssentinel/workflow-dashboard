import { NextRequest, NextResponse } from 'next/server';
import { generateText, AIProvider } from '@/lib/ai/providers';

const SYSTEM_PROMPT = `You are an AI workflow designer. When given a natural language description of a task or workflow, you generate a structured workflow with nodes and edges.

Your output must be valid JSON in this exact format:
{
  "nodes": [
    {
      "id": "unique-id",
      "type": "custom",
      "position": { "x": number, "y": number },
      "data": {
        "label": "Node Label",
        "type": "agent" | "tool" | "condition" | "loop" | "parallel" | "start" | "end",
        "prompt": "AI prompt for this step (for agent nodes)",
        "model": "claude-sonnet-4-5-20250929" (optional),
        "tools": ["tool1", "tool2"] (optional),
        "config": {} (optional, for condition/loop nodes)
      }
    }
  ],
  "edges": [
    {
      "id": "unique-edge-id",
      "source": "source-node-id",
      "target": "target-node-id",
      "type": "smoothstep"
    }
  ]
}

Guidelines:
- Always start with a "start" node and end with an "end" node
- Use "agent" nodes for AI tasks that need reasoning
- Use "tool" nodes for specific tool calls (file operations, web searches, etc.)
- Use "condition" nodes for branching logic
- Use "loop" nodes for repetitive tasks
- Use "parallel" nodes when tasks can run concurrently
- Position nodes in a logical flow (left to right, top to bottom)
- Space nodes 300-400 pixels apart for readability
- Write clear, specific prompts for agent nodes
- Choose appropriate models (use sonnet for complex tasks, haiku for simple ones)

Return ONLY the JSON, no markdown formatting, no explanations.`;

export async function POST(request: NextRequest) {
  try {
    const { description, provider = 'claude' } = await request.json();

    if (!description) {
      return NextResponse.json({ error: 'Description required' }, { status: 400 });
    }

    // Check if the requested provider is configured
    const claudeKey = process.env.ANTHROPIC_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (provider === 'claude' && !claudeKey) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured. Add it to .env.local or use Gemini instead.' },
        { status: 500 }
      );
    }

    if (provider === 'gemini' && !geminiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY not configured. Add it to .env.local or use Claude instead.' },
        { status: 500 }
      );
    }

    // Generate workflow using selected AI provider
    const responseText = await generateText(
      provider as AIProvider,
      `Create a workflow for this request:\n\n${description}`,
      {
        systemPrompt: SYSTEM_PROMPT,
        model: provider === 'claude' ? 'claude-sonnet-4-5-20250929' : 'gemini-2.5-flash',
      }
    );

    // Extract JSON from response
    let workflowData;
    try {
      // Try to parse JSON directly
      workflowData = JSON.parse(responseText);
    } catch {
      // If that fails, try to extract JSON from markdown code block
      const jsonMatch = responseText.match(/```(?:json)?\n?([\s\S]+?)\n?```/);
      if (jsonMatch) {
        workflowData = JSON.parse(jsonMatch[1]);
      } else {
        // Last resort: try to find JSON in the text
        const jsonStart = responseText.indexOf('{');
        const jsonEnd = responseText.lastIndexOf('}') + 1;
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          workflowData = JSON.parse(responseText.slice(jsonStart, jsonEnd));
        } else {
          throw new Error('Could not extract JSON from response');
        }
      }
    }

    // Validate structure
    if (!workflowData.nodes || !Array.isArray(workflowData.nodes)) {
      throw new Error('Invalid workflow structure: missing nodes array');
    }

    if (!workflowData.edges || !Array.isArray(workflowData.edges)) {
      throw new Error('Invalid workflow structure: missing edges array');
    }

    return NextResponse.json(workflowData);
  } catch (error) {
    console.error('[Vibe] Generation error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Generation failed',
      },
      { status: 500 }
    );
  }
}
