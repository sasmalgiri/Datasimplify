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
  type ContentType,
} from '@/lib/templates/generator';
import type { TemplateType } from '@/lib/templates/templateConfig';

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate content type
    // Note: 'full' (embedded charts) removed - only offer Interactive, Native Charts, Formulas Only
    const validContentTypes: ContentType[] = ['formulas_only', 'addin', 'native_charts'];
    const contentType: ContentType = validContentTypes.includes(body.contentType)
      ? body.contentType
      : 'addin';

    // Build user configuration
    const userConfig: UserTemplateConfig = {
      templateType: (body.templateType as TemplateType) || 'screener',
      coins: Array.isArray(body.coins) ? body.coins : [],
      timeframe: body.timeframe || '24h',
      currency: body.currency || 'USD',
      contentType,
      customizations: {
        // For formulas_only, override includeCharts to false
        includeCharts: contentType === 'formulas_only' ? false : body.customizations?.includeCharts !== false,
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
      contentType: userConfig.contentType,
      coins: userConfig.coins.length,
      format,
    });

    const buffer = await generateTemplate(userConfig, format);

    // Generate filename with content type label
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const contentLabel = contentType === 'formulas_only' ? '_formulas' :
                        contentType === 'addin' ? '_interactive' : '_native';
    const filename = `cryptoreportkit_${userConfig.templateType}${contentLabel}_${timestamp}.${format}`;

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
        supportedContentTypes: [
          { id: 'addin', name: 'Interactive Charts', description: 'Animated ChartJS charts via Office.js Add-in (requires M365)' },
          { id: 'native_charts', name: 'Native Excel Charts', description: 'Chart-ready data layout with instructions (works everywhere)' },
          { id: 'formulas_only', name: 'Formulas Only', description: 'Just CryptoSheets formulas, no charts' },
        ],
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
