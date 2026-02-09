/**
 * CRK Formula Template Download
 *
 * GET /api/v1/templates/crk?id=portfolio-tracker
 *
 * Returns pre-built Excel files with CRK formulas.
 * No auth required - templates only contain formulas (no data).
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateCrkTemplate, CRK_TEMPLATES } from '@/lib/templates/crkFormulaTpls';

export async function GET(request: NextRequest) {
  try {
    const templateId = request.nextUrl.searchParams.get('id');

    if (!templateId) {
      return NextResponse.json({ templates: CRK_TEMPLATES });
    }

    const template = CRK_TEMPLATES.find(t => t.id === templateId);
    if (!template) {
      return NextResponse.json({ error: 'Unknown template. Available: ' + CRK_TEMPLATES.map(t => t.id).join(', ') }, { status: 400 });
    }

    const buffer = await generateCrkTemplate(templateId);
    const fileName = `CRK-${template.name.replace(/\s+/g, '-')}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err) {
    console.error('[CRK Template] Error:', err);
    return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 });
  }
}
