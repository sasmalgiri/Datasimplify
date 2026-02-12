/**
 * iconSetInjector.ts — OOXML Icon Set Conditional Formatting Injection
 *
 * Post-processes an xlsx buffer to inject 3-arrow and traffic light icon sets
 * on change% columns in data tables. ExcelJS doesn't support icon sets natively,
 * so we inject the OOXML `<conditionalFormatting>` XML directly into sheet XML.
 *
 * Runs AFTER sparklineInjector in the pipeline.
 *
 * OOXML structure:
 *   <conditionalFormatting sqref="F6:F25">
 *     <cfRule type="iconSet" priority="1">
 *       <iconSet iconSet="3Arrows">
 *         <cfvo type="num" val="-999"/>
 *         <cfvo type="num" val="0"/>
 *         <cfvo type="num" val="0.01"/>
 *       </iconSet>
 *     </cfRule>
 *   </conditionalFormatting>
 */

import JSZip from 'jszip';

// ============================================
// Types
// ============================================

export interface IconSetDef {
  sheetName: string;
  /** Cell range reference, e.g., "F6:F25" */
  sqref: string;
  /** Icon set type */
  iconSet: '3Arrows' | '3ArrowsGray' | '3TrafficLights1' | '3TrafficLights2' | '3Symbols' | '3Signs' | '3Stars' | '3Flags';
  /**
   * Threshold values for icon transitions.
   * For 3-icon sets: [low, mid, high] — values below low get down arrow,
   * between low and high get sideways, above high get up arrow.
   * Defaults: [-999, 0, 0.01] (negative = down, zero = sideways, positive = up)
   */
  thresholds?: [number, number, number];
  /** Show icon only (hide the number). Default false. */
  showValue?: boolean;
  /** Reverse icon order. Default false. */
  reverse?: boolean;
}

// ============================================
// Main Entry Point
// ============================================

/**
 * Injects icon set conditional formatting into an xlsx buffer.
 * Groups icon sets by sheet and adds <conditionalFormatting> elements.
 */
export async function injectIconSets(
  xlsxBuffer: Buffer,
  iconSets: IconSetDef[],
): Promise<Buffer> {
  if (!iconSets.length) return xlsxBuffer;

  try {
    const zip = await JSZip.loadAsync(xlsxBuffer);
    const sheetMap = await resolveSheetMap(zip);

    // Group by sheet
    const bySheet = new Map<string, IconSetDef[]>();
    for (const def of iconSets) {
      const arr = bySheet.get(def.sheetName) || [];
      arr.push(def);
      bySheet.set(def.sheetName, arr);
    }

    for (const [sheetName, defs] of bySheet) {
      const sheetIdx = sheetMap.get(sheetName);
      if (sheetIdx === undefined) {
        console.warn(`[IconSetInjector] Sheet "${sheetName}" not found, skipping`);
        continue;
      }

      const sheetPath = `xl/worksheets/sheet${sheetIdx}.xml`;
      const file = zip.file(sheetPath);
      if (!file) continue;

      let xml = await file.async('text');

      // Build conditional formatting XML for each icon set
      let priority = 100; // Start high to avoid conflicts with ExcelJS-generated rules
      for (const def of defs) {
        const cfXml = buildIconSetCF(def, priority);
        priority++;

        // Insert before <pageMargins>, <drawing>, <extLst>, or </worksheet>
        // (conditional formatting must appear before these elements in OOXML spec)
        const insertBefore = findInsertPoint(xml);
        xml = xml.slice(0, insertBefore) + cfXml + '\n' + xml.slice(insertBefore);
      }

      zip.file(sheetPath, xml);
    }

    const result = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    return Buffer.from(result);
  } catch (err) {
    console.error('[IconSetInjector] Injection failed, returning original buffer:', err);
    return xlsxBuffer;
  }
}

// ============================================
// XML Builder
// ============================================

function buildIconSetCF(def: IconSetDef, priority: number): string {
  const thresholds = def.thresholds || [-999, 0, 0.01];
  const showValueAttr = def.showValue === false ? ' showValue="0"' : '';
  const reverseAttr = def.reverse ? ' reverse="1"' : '';
  const iconSetAttr = def.iconSet !== '3Arrows' ? ` iconSet="${def.iconSet}"` : '';

  return `<conditionalFormatting sqref="${def.sqref}">
  <cfRule type="iconSet" priority="${priority}">
    <iconSet${iconSetAttr}${reverseAttr}${showValueAttr}>
      <cfvo type="num" val="${thresholds[0]}"/>
      <cfvo type="num" val="${thresholds[1]}"/>
      <cfvo type="num" val="${thresholds[2]}"/>
    </iconSet>
  </cfRule>
</conditionalFormatting>`;
}

/**
 * Find the correct insertion point for <conditionalFormatting> in sheet XML.
 * Must appear before: <pageMargins>, <pageSetup>, <drawing>, <extLst>, </worksheet>
 */
function findInsertPoint(xml: string): number {
  // Try each element in order of priority
  const targets = ['<pageMargins', '<pageSetup', '<headerFooter', '<drawing ', '<extLst>', '</worksheet>'];
  for (const target of targets) {
    const idx = xml.indexOf(target);
    if (idx !== -1) return idx;
  }
  // Fallback: before closing tag
  return xml.lastIndexOf('</worksheet>');
}

// ============================================
// ZIP Helpers
// ============================================

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
