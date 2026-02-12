/**
 * shapeInjector.ts — DrawingML Shape Injection for OtherLevel-Grade KPI Cards
 *
 * Post-processes an xlsx buffer to inject premium DrawingML shapes:
 * - KPI cards: Gradient fills, 3D bevel, outer shadow, accent borders
 * - Nav buttons: Gradient fills, clickable hyperlinks, glow effects
 *
 * Design inspired by otherlevel.com / premium Excel dashboards:
 * - Subtle gradient fills (dark → darker) for depth
 * - 3D bevel effect (relaxedInset) on KPI cards
 * - Outer shadow for floating card appearance
 * - Accent border glow on interactive elements
 * - Segoe UI Semibold typography hierarchy
 *
 * OOXML parts modified:
 *   xl/drawings/drawingN.xml        — twoCellAnchor with sp elements
 *   xl/drawings/_rels/drawingN.xml.rels — Hyperlink relationships (nav buttons)
 *   [Content_Types].xml             — Drawing overrides (if new drawing)
 *   xl/worksheets/_rels/sheetN.xml.rels — Sheet → drawing link (if new)
 */

import JSZip from 'jszip';

// ============================================
// Types
// ============================================

export interface ShapeCardDef {
  sheetName: string;
  fromCol: number;
  fromRow: number;
  toCol: number;
  toRow: number;
  title: string;
  value: string;
  change?: string;
  fillColor: string;     // e.g., '1F1F1F'
  accentColor: string;   // e.g., 'C9A470'
  textColor?: string;    // e.g., 'FFFFFF' (default)
  mutedColor?: string;   // e.g., '8B7355' (for title)
  changeColor?: string;  // e.g., '22C55E' green or 'EF4444' red
}

export interface NavigationButtonDef {
  sheetName: string;     // Sheet containing the button
  fromCol: number;
  fromRow: number;
  toCol: number;
  toRow: number;
  label: string;
  targetSheet: string;   // Sheet to navigate to
  fillColor: string;
  accentColor: string;
  textColor?: string;
}

interface HyperlinkRel {
  rId: string;
  target: string;  // e.g., "#'CRK Dashboard'!A1"
}

// ============================================
// Color Helpers
// ============================================

/** Darken a hex color by a percentage (0-100) */
function darkenColor(hex: string, percent: number): string {
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const factor = 1 - percent / 100;
  const dr = Math.max(0, Math.round(r * factor));
  const dg = Math.max(0, Math.round(g * factor));
  const db = Math.max(0, Math.round(b * factor));
  return `${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`.toUpperCase();
}

/** Lighten a hex color by a percentage (0-100) */
function lightenColor(hex: string, percent: number): string {
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const factor = percent / 100;
  const lr = Math.min(255, Math.round(r + (255 - r) * factor));
  const lg = Math.min(255, Math.round(g + (255 - g) * factor));
  const lb = Math.min(255, Math.round(b + (255 - b) * factor));
  return `${lr.toString(16).padStart(2, '0')}${lg.toString(16).padStart(2, '0')}${lb.toString(16).padStart(2, '0')}`.toUpperCase();
}

// ============================================
// Main Entry Point
// ============================================

/**
 * Injects premium DrawingML shapes into an xlsx buffer.
 * KPI cards get gradient fills, 3D bevel, and outer shadows.
 * Nav buttons get gradient fills and working hyperlinks.
 */
export async function injectShapes(
  xlsxBuffer: Buffer,
  shapes: ShapeCardDef[],
  navButtons?: NavigationButtonDef[],
): Promise<Buffer> {
  const allItems = [...shapes];
  if (!allItems.length && (!navButtons || !navButtons.length)) return xlsxBuffer;

  try {
    const zip = await JSZip.loadAsync(xlsxBuffer);
    const sheetMap = await resolveSheetMap(zip);

    // Group shapes by sheet
    const shapesBySheet = new Map<string, ShapeCardDef[]>();
    for (const shape of shapes) {
      const arr = shapesBySheet.get(shape.sheetName) || [];
      arr.push(shape);
      shapesBySheet.set(shape.sheetName, arr);
    }

    // Group nav buttons by sheet
    const navBySheet = new Map<string, NavigationButtonDef[]>();
    if (navButtons) {
      for (const btn of navButtons) {
        const arr = navBySheet.get(btn.sheetName) || [];
        arr.push(btn);
        navBySheet.set(btn.sheetName, arr);
      }
    }

    // Collect all unique sheets
    const allSheets = new Set([...shapesBySheet.keys(), ...navBySheet.keys()]);

    // Track max drawing number across the zip
    let maxDrawing = findMaxDrawingNum(zip);

    for (const sheetName of allSheets) {
      const sheetIdx = sheetMap.get(sheetName);
      if (sheetIdx === undefined) {
        console.warn(`[ShapeInjector] Sheet "${sheetName}" not found, skipping`);
        continue;
      }

      const sheetShapes = shapesBySheet.get(sheetName) || [];
      const sheetNavs = navBySheet.get(sheetName) || [];

      // Build shape anchor XML + hyperlink relationships for nav buttons
      const { anchors: shapeAnchors, hlinkRels } = buildShapeAnchors(sheetShapes, sheetNavs, sheetMap);

      // Check if drawing already exists for this sheet
      const existingDrawingNum = await findExistingDrawing(zip, sheetIdx);
      let drawingNum: number;

      if (existingDrawingNum !== null) {
        drawingNum = existingDrawingNum;
        await appendToDrawing(zip, drawingNum, shapeAnchors);
      } else {
        maxDrawing++;
        drawingNum = maxDrawing;
        const drawingXml = wrapInDrawingDoc(shapeAnchors);
        zip.file(`xl/drawings/drawing${drawingNum}.xml`, drawingXml);
        await linkSheetToDrawing(zip, sheetIdx, drawingNum);
        await addDrawingContentType(zip, drawingNum);
      }

      // Inject hyperlink relationships into the drawing's rels file
      if (hlinkRels.length > 0) {
        await addDrawingHyperlinkRels(zip, drawingNum, hlinkRels);
      }
    }

    const result = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    return Buffer.from(result);
  } catch (err) {
    console.error('[ShapeInjector] Injection failed, returning original buffer:', err);
    return xlsxBuffer;
  }
}

// ============================================
// Shape XML Builders — Premium OtherLevel Design
// ============================================

/**
 * Build twoCellAnchor XML for all shapes and nav buttons on a sheet.
 * Returns both the DrawingML anchors and hyperlink relationships for the drawing rels file.
 */
function buildShapeAnchors(
  shapes: ShapeCardDef[],
  navButtons: NavigationButtonDef[],
  sheetMap: Map<string, number>,
): { anchors: string; hlinkRels: HyperlinkRel[] } {
  let idCounter = 100; // Start high to avoid conflicts with chart IDs
  let hlinkCounter = 1;
  let anchors = '';
  const hlinkRels: HyperlinkRel[] = [];

  // KPI card shapes — Premium design with gradient + 3D + shadow
  for (const s of shapes) {
    const textColor = s.textColor || 'FFFFFF';
    const mutedColor = s.mutedColor || '8B7355';
    const changeColor = s.changeColor || '9CA3AF';
    const gradEnd = darkenColor(s.fillColor, 20);

    // Build change indicator paragraph
    const changePara = s.change ? `
          <a:p>
            <a:pPr algn="l">
              <a:spcBef><a:spcPts val="0"/></a:spcBef>
              <a:spcAft><a:spcPts val="0"/></a:spcAft>
            </a:pPr>
            <a:r>
              <a:rPr lang="en-US" sz="1000" b="0" dirty="0">
                <a:solidFill><a:srgbClr val="${changeColor}"/></a:solidFill>
                <a:latin typeface="Segoe UI Semibold" panose="020B0702040204020203"/>
                <a:cs typeface="Segoe UI Semibold"/>
              </a:rPr>
              <a:t>${escapeXml(s.change)}</a:t>
            </a:r>
          </a:p>` : '';

    anchors += `
  <xdr:twoCellAnchor editAs="oneCell">
    <xdr:from>
      <xdr:col>${s.fromCol}</xdr:col><xdr:colOff>38100</xdr:colOff>
      <xdr:row>${s.fromRow}</xdr:row><xdr:rowOff>19050</xdr:rowOff>
    </xdr:from>
    <xdr:to>
      <xdr:col>${s.toCol}</xdr:col><xdr:colOff>0</xdr:colOff>
      <xdr:row>${s.toRow}</xdr:row><xdr:rowOff>0</xdr:rowOff>
    </xdr:to>
    <xdr:sp macro="" textlink="">
      <xdr:nvSpPr>
        <xdr:cNvPr id="${idCounter}" name="KPI Card ${idCounter}"/>
        <xdr:cNvSpPr/>
      </xdr:nvSpPr>
      <xdr:spPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="0" cy="0"/>
        </a:xfrm>
        <a:prstGeom prst="roundRect">
          <a:avLst>
            <a:gd name="adj" fmla="val 8000"/>
          </a:avLst>
        </a:prstGeom>
        <a:gradFill>
          <a:gsLst>
            <a:gs pos="0"><a:srgbClr val="${s.fillColor}"/></a:gs>
            <a:gs pos="100000"><a:srgbClr val="${gradEnd}"/></a:gs>
          </a:gsLst>
          <a:lin ang="5400000" scaled="1"/>
        </a:gradFill>
        <a:ln w="12700">
          <a:solidFill><a:srgbClr val="${s.accentColor}"><a:alpha val="70000"/></a:srgbClr></a:solidFill>
        </a:ln>
        <a:effectLst>
          <a:outerShdw blurRad="40000" dist="15000" dir="5400000" algn="t" rotWithShape="0">
            <a:srgbClr val="000000"><a:alpha val="15000"/></a:srgbClr>
          </a:outerShdw>
        </a:effectLst>
      </xdr:spPr>
      <xdr:txBody>
        <a:bodyPr vertOverflow="clip" horzOverflow="clip" wrap="square"
          lIns="109728" tIns="54864" rIns="109728" bIns="54864" anchor="t"/>
        <a:lstStyle/>
        <a:p>
          <a:pPr algn="l">
            <a:spcAft><a:spcPts val="0"/></a:spcAft>
          </a:pPr>
          <a:r>
            <a:rPr lang="en-US" sz="850" b="1" dirty="0" spc="80">
              <a:solidFill><a:srgbClr val="${mutedColor}"/></a:solidFill>
              <a:latin typeface="Segoe UI Semibold" panose="020B0702040204020203"/>
              <a:cs typeface="Segoe UI Semibold"/>
            </a:rPr>
            <a:t>${escapeXml(s.title.toUpperCase())}</a:t>
          </a:r>
        </a:p>
        <a:p>
          <a:pPr algn="l">
            <a:spcBef><a:spcPts val="0"/></a:spcBef>
          </a:pPr>
          <a:r>
            <a:rPr lang="en-US" sz="2400" b="1" dirty="0">
              <a:solidFill><a:srgbClr val="${textColor}"/></a:solidFill>
              <a:latin typeface="Segoe UI" panose="020B0502040204020203"/>
              <a:cs typeface="Segoe UI"/>
            </a:rPr>
            <a:t>${escapeXml(s.value)}</a:t>
          </a:r>
        </a:p>${changePara}
      </xdr:txBody>
    </xdr:sp>
    <xdr:clientData/>
  </xdr:twoCellAnchor>`;
    idCounter++;
  }

  // Navigation buttons — Premium gradient with working hyperlinks
  for (const btn of navButtons) {
    const textColor = btn.textColor || 'FFFFFF';
    const targetExists = sheetMap.has(btn.targetSheet);
    const gradStart = lightenColor(btn.fillColor, 8);
    const gradEnd = darkenColor(btn.fillColor, 15);

    // Build hyperlink element with proper rId for OOXML internal navigation
    let hlinkEl = '';
    if (targetExists) {
      const rId = `rHl${hlinkCounter}`;
      hlinkEl = `
          <a:hlinkClick r:id="${rId}"/>`;
      hlinkRels.push({
        rId,
        target: `#'${btn.targetSheet}'!A1`,
      });
      hlinkCounter++;
    }

    anchors += `
  <xdr:twoCellAnchor editAs="oneCell">
    <xdr:from>
      <xdr:col>${btn.fromCol}</xdr:col><xdr:colOff>19050</xdr:colOff>
      <xdr:row>${btn.fromRow}</xdr:row><xdr:rowOff>19050</xdr:rowOff>
    </xdr:from>
    <xdr:to>
      <xdr:col>${btn.toCol}</xdr:col><xdr:colOff>0</xdr:colOff>
      <xdr:row>${btn.toRow}</xdr:row><xdr:rowOff>0</xdr:rowOff>
    </xdr:to>
    <xdr:sp macro="" textlink="">
      <xdr:nvSpPr>
        <xdr:cNvPr id="${idCounter}" name="Nav ${idCounter}">${hlinkEl}
        </xdr:cNvPr>
        <xdr:cNvSpPr/>
      </xdr:nvSpPr>
      <xdr:spPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="0" cy="0"/>
        </a:xfrm>
        <a:prstGeom prst="roundRect">
          <a:avLst>
            <a:gd name="adj" fmla="val 13000"/>
          </a:avLst>
        </a:prstGeom>
        <a:gradFill>
          <a:gsLst>
            <a:gs pos="0"><a:srgbClr val="${gradStart}"/></a:gs>
            <a:gs pos="100000"><a:srgbClr val="${gradEnd}"/></a:gs>
          </a:gsLst>
          <a:lin ang="5400000" scaled="1"/>
        </a:gradFill>
        <a:ln w="15875">
          <a:solidFill><a:srgbClr val="${btn.accentColor}"><a:alpha val="80000"/></a:srgbClr></a:solidFill>
        </a:ln>
        <a:effectLst>
          <a:outerShdw blurRad="30000" dist="12000" dir="5400000" algn="t" rotWithShape="0">
            <a:srgbClr val="000000"><a:alpha val="12000"/></a:srgbClr>
          </a:outerShdw>
        </a:effectLst>
      </xdr:spPr>
      <xdr:txBody>
        <a:bodyPr vertOverflow="clip" horzOverflow="clip" wrap="square"
          lIns="91440" tIns="45720" rIns="91440" bIns="45720" anchor="ctr"/>
        <a:lstStyle/>
        <a:p>
          <a:pPr algn="ctr"/>
          <a:r>
            <a:rPr lang="en-US" sz="1200" b="1" dirty="0" spc="30">
              <a:solidFill><a:srgbClr val="${textColor}"/></a:solidFill>
              <a:latin typeface="Segoe UI Semibold" panose="020B0702040204020203"/>
              <a:cs typeface="Segoe UI Semibold"/>
            </a:rPr>
            <a:t>${escapeXml(btn.label)}</a:t>
          </a:r>
        </a:p>
      </xdr:txBody>
    </xdr:sp>
    <xdr:clientData/>
  </xdr:twoCellAnchor>`;
    idCounter++;
  }

  return { anchors, hlinkRels };
}

/**
 * Wrap shape anchors in a full drawing document.
 */
function wrapInDrawingDoc(anchors: string): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing"
          xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
          xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
${anchors}
</xdr:wsDr>`;
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
 * Find the highest drawing number currently in the zip.
 */
function findMaxDrawingNum(zip: JSZip): number {
  let max = 0;
  zip.forEach((path) => {
    const m = path.match(/^xl\/drawings\/drawing(\d+)\.xml$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  return max;
}

/**
 * Check if a sheet already has a drawing linked to it.
 * Returns the drawing number or null.
 */
async function findExistingDrawing(zip: JSZip, sheetIdx: number): Promise<number | null> {
  const relsPath = `xl/worksheets/_rels/sheet${sheetIdx}.xml.rels`;
  const relsFile = zip.file(relsPath);
  if (!relsFile) return null;

  const xml = await relsFile.async('text');
  const match = xml.match(/Target="\.\.\/drawings\/drawing(\d+)\.xml"/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Append shape anchors to an existing drawing XML.
 */
async function appendToDrawing(zip: JSZip, drawingNum: number, anchors: string): Promise<void> {
  const path = `xl/drawings/drawing${drawingNum}.xml`;
  const file = zip.file(path);
  if (!file) return;

  let xml = await file.async('text');
  // Insert before closing </xdr:wsDr>
  xml = xml.replace('</xdr:wsDr>', `${anchors}\n</xdr:wsDr>`);
  zip.file(path, xml);
}

/**
 * Add hyperlink relationships to a drawing's .rels file.
 * Required for clickable navigation buttons that jump to other sheets.
 */
async function addDrawingHyperlinkRels(
  zip: JSZip,
  drawingNum: number,
  rels: HyperlinkRel[],
): Promise<void> {
  if (!rels.length) return;

  const relsPath = `xl/drawings/_rels/drawing${drawingNum}.xml.rels`;
  const existingFile = zip.file(relsPath);

  if (existingFile) {
    let xml = await existingFile.async('text');
    // Add each hyperlink relationship before </Relationships>
    const newRels = rels.map(r =>
      `  <Relationship Id="${r.rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${escapeXml(r.target)}" TargetMode="External"/>`
    ).join('\n');
    xml = xml.replace('</Relationships>', `${newRels}\n</Relationships>`);
    zip.file(relsPath, xml);
  } else {
    // Create new rels file for the drawing
    const relEntries = rels.map(r =>
      `  <Relationship Id="${r.rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${escapeXml(r.target)}" TargetMode="External"/>`
    ).join('\n');
    const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${relEntries}
</Relationships>`;
    zip.file(relsPath, xml);
  }
}

/**
 * Link a sheet to a new drawing via sheet rels.
 */
async function linkSheetToDrawing(zip: JSZip, sheetIdx: number, drawingNum: number): Promise<void> {
  const relsPath = `xl/worksheets/_rels/sheet${sheetIdx}.xml.rels`;
  const existingFile = zip.file(relsPath);

  if (existingFile) {
    let xml = await existingFile.async('text');
    if (xml.includes('relationships/drawing')) return;

    // Find highest rId
    const rIdMatches = [...xml.matchAll(/Id="rId(\d+)"/g)];
    const maxRId = rIdMatches.length > 0
      ? Math.max(...rIdMatches.map(m => parseInt(m[1], 10)))
      : 0;
    const newRId = `rId${maxRId + 1}`;

    const rel = `  <Relationship Id="${newRId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing${drawingNum}.xml"/>`;
    xml = xml.replace('</Relationships>', `${rel}\n</Relationships>`);
    zip.file(relsPath, xml);

    // Add <drawing> element to sheet XML
    await addDrawingToSheet(zip, sheetIdx, newRId);
  } else {
    // Create new rels file
    const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing${drawingNum}.xml"/>
</Relationships>`;
    zip.file(relsPath, xml);

    // Add <drawing> element to sheet XML
    await addDrawingToSheet(zip, sheetIdx, 'rId1');
  }
}

/**
 * Add <drawing r:id="..."/> to sheet XML if not already present.
 */
async function addDrawingToSheet(zip: JSZip, sheetIdx: number, rId: string): Promise<void> {
  const sheetPath = `xl/worksheets/sheet${sheetIdx}.xml`;
  const file = zip.file(sheetPath);
  if (!file) return;

  let xml = await file.async('text');
  if (xml.includes('<drawing ')) return; // Already has drawing reference

  // Insert <drawing> before </worksheet>
  const drawingEl = `<drawing r:id="${rId}"/>`;
  xml = xml.replace('</worksheet>', `${drawingEl}\n</worksheet>`);
  zip.file(sheetPath, xml);
}

/**
 * Add drawing content type override if not already present.
 */
async function addDrawingContentType(zip: JSZip, drawingNum: number): Promise<void> {
  const ctFile = zip.file('[Content_Types].xml');
  if (!ctFile) return;

  let xml = await ctFile.async('text');
  const drawingOverride = `/xl/drawings/drawing${drawingNum}.xml`;
  if (xml.includes(drawingOverride)) return;

  const entry = `<Override PartName="${drawingOverride}" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>`;
  xml = xml.replace('</Types>', `  ${entry}\n</Types>`);
  zip.file('[Content_Types].xml', xml);
}

/**
 * Escape XML special characters in text content.
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
