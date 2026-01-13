/**
 * Template Download API Route
 *
 * Generates and returns Excel templates with CryptoSheets formulas.
 * No data redistribution - templates contain formulas only.
 */

import { NextResponse } from 'next/server';
import {
  generateTemplate,
  validateUserConfig,
  type UserTemplateConfig,
} from '@/lib/templates/generator';
import type { TemplateType } from '@/lib/templates/templateConfig';

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();

    // Build user configuration
    const userConfig: UserTemplateConfig = {
      templateType: (body.templateType as TemplateType) || 'screener',
      coins: Array.isArray(body.coins) ? body.coins : [],
      timeframe: body.timeframe || '24h',
      currency: body.currency || 'USD',
      customizations: {
        includeCharts: body.customizations?.includeCharts !== false, // Default true
        metricsList: body.customizations?.metricsList || [],
        ...body.customizations,
      },
    };

    // Validate configuration
    const validation = validateUserConfig(userConfig);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Invalid configuration',
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    // Determine format (.xlsx or .xlsm)
    const format = body.format === 'xlsm' ? 'xlsm' : 'xlsx';

    // Generate template
    console.log('[Templates] Generating template:', {
      type: userConfig.templateType,
      coins: userConfig.coins.length,
      format,
    });

    const buffer = await generateTemplate(userConfig, format);

    // Generate filename
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `datasimplify_${userConfig.templateType}_${timestamp}.${format}`;

    // Return file (convert Buffer to Uint8Array for NextResponse compatibility)
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type':
          format === 'xlsm'
            ? 'application/vnd.ms-excel.sheet.macroEnabled.12'
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Template-Type': userConfig.templateType,
        'X-Template-Format': format,
      },
    });
  } catch (error) {
    console.error('[Templates] Generation error:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate template',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint - returns available templates list
 */
export async function GET() {
  const { getTemplateList } = await import('@/lib/templates/templateConfig');

  try {
    const templates = getTemplateList();

    return NextResponse.json({
      success: true,
      templates,
      info: {
        requiresAddons: ['CryptoSheets'],
        supportedFormats: ['xlsx', 'xlsm'],
        dataIncluded: false,
        formulasOnly: true,
      },
    });
  } catch (error) {
    console.error('[Templates] List error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch template list',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
