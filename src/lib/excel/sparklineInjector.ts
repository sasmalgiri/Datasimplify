/**
 * sparklineInjector.ts — Real Excel Sparkline Injection
 *
 * Post-processes an xlsx buffer to inject native Excel sparklines into sheets.
 * Sparklines render as tiny in-cell charts (line, column, or win/loss) that
 * visualize trends without taking up a full chart slot.
 *
 * Uses the x14 extension namespace (<x14:sparklineGroups>) which is supported
 * by Excel 2010+ and Excel 365.
 *
 * Runs AFTER shapeInjector in the pipeline.
 *
 * OOXML parts modified:
 *   xl/worksheets/sheetN.xml — Appends <extLst> with sparklineGroups
 */

import JSZip from 'jszip';

// ============================================
// Types
// ============================================

export interface SparklineDef {
  sheetName: string;         // Sheet containing the sparkline display cell
  targetCell: string;        // e.g., "K5" — where sparkline renders
  dataRange: string;         // e.g., "'CRK Data'!B6:B26"
  type: 'line' | 'column' | 'stacked';
  colorSeries: string;       // ARGB hex e.g., "FF10B981"
  colorHigh?: string;        // ARGB hex e.g., "FF22C55E"
  colorLow?: string;         // ARGB hex e.g., "FFEF4444"
  colorFirst?: string;       // ARGB hex for first point
  colorLast?: string;        // ARGB hex for last point
  colorNegative?: string;    // ARGB hex for negative values
  colorMarkers?: string;     // ARGB hex for markers
  showMarkers?: boolean;
  showHighLow?: boolean;
  showFirst?: boolean;
  showLast?: boolean;
  lineWeight?: number;       // in points, default 0.75
}

// ============================================
// Main Entry Point
// ============================================

/**
 * Injects native Excel sparklines into an xlsx buffer.
 * Groups sparklines by sheet and appends <extLst> to each sheet XML.
 */
export async function injectSparklines(
  xlsxBuffer: Buffer,
  sparklines: SparklineDef[],
): Promise<Buffer> {
  if (!sparklines.length) return xlsxBuffer;

  try {
    const zip = await JSZip.loadAsync(xlsxBuffer);
    const sheetMap = await resolveSheetMap(zip);

    // Group sparklines by sheet
    const bySheet = new Map<string, SparklineDef[]>();
    for (const sp of sparklines) {
      const arr = bySheet.get(sp.sheetName) || [];
      arr.push(sp);
      bySheet.set(sp.sheetName, arr);
    }

    for (const [sheetName, defs] of bySheet) {
      const sheetIdx = sheetMap.get(sheetName);
      if (sheetIdx === undefined) {
        console.warn(`[SparklineInjector] Sheet "${sheetName}" not found, skipping`);
        continue;
      }

      const sheetPath = `xl/worksheets/sheet${sheetIdx}.xml`;
      const file = zip.file(sheetPath);
      if (!file) continue;

      let xml = await file.async('text');

      // Build sparkline groups XML
      const sparklineXml = buildSparklineExtension(defs, sheetName);

      // Check if sheet already has <extLst>
      if (xml.includes('<extLst>')) {
        // Append inside existing <extLst>
        xml = xml.replace('</extLst>', `${sparklineXml}\n</extLst>`);
      } else {
        // Insert <extLst> before closing </worksheet>
        xml = xml.replace('</worksheet>', `<extLst>\n${sparklineXml}\n</extLst>\n</worksheet>`);
      }

      zip.file(sheetPath, xml);
    }

    const result = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    return Buffer.from(result);
  } catch (err) {
    console.error('[SparklineInjector] Injection failed, returning original buffer:', err);
    return xlsxBuffer;
  }
}

// ============================================
// Sparkline XML Builder
// ============================================

/**
 * Builds the <ext> element containing sparkline groups for a sheet.
 * Each SparklineDef becomes one sparkline within a sparkline group.
 * Groups are organized by type + color combination for efficiency.
 */
function buildSparklineExtension(defs: SparklineDef[], sheetName: string): string {
  // Group by type + colorSeries for efficient sparkline groups
  const groups = new Map<string, SparklineDef[]>();
  for (const def of defs) {
    const key = `${def.type}|${def.colorSeries}|${def.showMarkers ?? false}|${def.showHighLow ?? false}`;
    const arr = groups.get(key) || [];
    arr.push(def);
    groups.set(key, arr);
  }

  let groupsXml = '';

  for (const [, groupDefs] of groups) {
    const representative = groupDefs[0];
    const sparkType = representative.type === 'column' ? 'column'
      : representative.type === 'stacked' ? 'stacked'
      : 'line';

    // Build attribute flags
    const attrs: string[] = [];
    if (sparkType !== 'line') attrs.push(`type="${sparkType}"`);
    attrs.push('displayEmptyCellsAs="gap"');
    if (representative.showMarkers) attrs.push('markers="1"');
    if (representative.showHighLow) {
      attrs.push('high="1"');
      attrs.push('low="1"');
    }
    if (representative.showFirst) attrs.push('first="1"');
    if (representative.showLast) attrs.push('last="1"');
    if (representative.lineWeight) {
      // Line weight in 1/100 of a point (OOXML spec)
      attrs.push(`manualMax="${representative.lineWeight}"`);
    }

    // Color elements
    const colors: string[] = [];
    colors.push(`        <x14:colorSeries rgb="${representative.colorSeries}"/>`);
    if (representative.colorNegative) {
      colors.push(`        <x14:colorNegative rgb="${representative.colorNegative}"/>`);
    }
    if (representative.colorHigh) {
      colors.push(`        <x14:colorHigh rgb="${representative.colorHigh}"/>`);
    }
    if (representative.colorLow) {
      colors.push(`        <x14:colorLow rgb="${representative.colorLow}"/>`);
    }
    if (representative.colorFirst) {
      colors.push(`        <x14:colorFirst rgb="${representative.colorFirst}"/>`);
    }
    if (representative.colorLast) {
      colors.push(`        <x14:colorLast rgb="${representative.colorLast}"/>`);
    }
    if (representative.colorMarkers) {
      colors.push(`        <x14:colorMarkers rgb="${representative.colorMarkers}"/>`);
    }

    // Build sparkline entries
    const sparklineEntries = groupDefs.map(def => {
      // Qualify the target cell with sheet name for sqref
      const qualifiedTarget = def.targetCell;
      // Formula refs use raw single quotes around sheet names — don't escape them
      return `          <x14:sparkline>
            <xm:f>${escapeXmlFormula(def.dataRange)}</xm:f>
            <xm:sqref>${qualifiedTarget}</xm:sqref>
          </x14:sparkline>`;
    }).join('\n');

    groupsXml += `
      <x14:sparklineGroup ${attrs.join(' ')}>
${colors.join('\n')}
        <x14:sparklines>
${sparklineEntries}
        </x14:sparklines>
      </x14:sparklineGroup>`;
  }

  return `  <ext uri="{05C60535-1F16-4fd2-B633-F4F36F0B64E0}"
       xmlns:x14="http://schemas.microsoft.com/office/spreadsheetml/2009/9/main"
       xmlns:xm="http://schemas.microsoft.com/office/excel/2006/main">
    <x14:sparklineGroups xmlns:xm="http://schemas.microsoft.com/office/excel/2006/main">${groupsXml}
    </x14:sparklineGroups>
  </ext>`;
}

// ============================================
// ZIP Helpers
// ============================================

/**
 * Parse workbook.xml to build sheetName → sheetIndex map.
 */
async function resolveSheetMap(zip: JSZip): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  const wbFile = zip.file('xl/workbook.xml');
  if (!wbFile) return map;
  const xml = await wbFile.async('text');
  const regex = /<sheet\s[^>]*name="([^"]*)"[^>]*/g;
  let match;
  let idx = 1;
  while ((match = regex.exec(xml)) !== null) {
    map.set(match[1], idx);
    idx++;
  }
  return map;
}

/**
 * Escape XML special characters in formula references.
 * Does NOT escape single quotes — Excel formulas use raw 'SheetName'!Ref syntax.
 */
function escapeXmlFormula(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
