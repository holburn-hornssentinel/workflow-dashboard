import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import type { WorkflowTemplate, TemplateMetadata } from '@/types/template';

const TEMPLATES_DIR = join(process.cwd(), 'data', 'templates');

/**
 * GET /api/templates
 * Returns all templates (metadata only) or a specific template by ID
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // If ID is provided, return full template
    if (id) {
      const templatePath = join(TEMPLATES_DIR, `${id}.json`);
      const templateData = readFileSync(templatePath, 'utf-8');
      const template: WorkflowTemplate = JSON.parse(templateData);

      return NextResponse.json(template);
    }

    // Otherwise, return all templates (metadata only)
    const files = readdirSync(TEMPLATES_DIR).filter((file) => file.endsWith('.json'));

    const templates: TemplateMetadata[] = files.map((file) => {
      const templatePath = join(TEMPLATES_DIR, file);
      const templateData = readFileSync(templatePath, 'utf-8');
      const template: WorkflowTemplate = JSON.parse(templateData);

      // Return metadata only (exclude nodes and edges)
      return {
        id: template.id,
        name: template.name,
        description: template.description,
        category: template.category,
        difficulty: template.difficulty,
        tags: template.tags,
        securityScore: template.securityScore,
        metadata: template.metadata,
      };
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Failed to load templates:', error);
    return NextResponse.json({ error: 'Failed to load templates' }, { status: 500 });
  }
}
