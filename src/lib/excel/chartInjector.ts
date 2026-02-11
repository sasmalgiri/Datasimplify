/**
 * chartInjector.ts — Native Excel Chart XML Injection via JSZip
 *
 * Post-processes an ExcelJS-generated xlsx buffer to inject real OOXML charts.
 * ExcelJS doesn't support charts, so we inject chart XML directly into the ZIP.
 *
 * Same pattern as powerQueryInjector.ts:
 *   JSZip.loadAsync(buffer) → add chart XML entries → modify rels → generateAsync()
 *
 * ZIP entries created per chart:
 *   xl/charts/chart{N}.xml          — Chart definition (bar/pie/line XML)
 *   xl/drawings/drawing{S}.xml      — twoCellAnchor positioning
 *   xl/drawings/_rels/drawing{S}.xml.rels — Links drawing → chart
 *
 * ZIP entries modified:
 *   [Content_Types].xml             — Register chart + drawing MIME types
 *   xl/worksheets/_rels/sheet{S}.xml.rels — Link sheet → drawing
 */

import JSZip from 'jszip';

// ============================================
// Types
// ============================================

export type ChartType = 'bar' | 'pie' | 'doughnut' | 'line';

export interface ChartSeriesRef {
  name: string;
  ref: string;       // e.g., "'CRK Dashboard'!$D$12:$D$31"
  color?: string;     // ARGB hex, e.g., 'FF10B981'
}

export interface ChartDefinition {
  id: string;
  type: ChartType;
  title: string;
  sheetName: string;
  dataRange: {
    categories: string;   // e.g., "'CRK Dashboard'!$B$12:$B$31"
    values: ChartSeriesRef[];
  };
  position: {
    fromCol: number;
    fromRow: number;
    toCol: number;
    toRow: number;
  };
  style?: {
    darkTheme?: boolean;
    showLegend?: boolean;
    colors?: string[];    // Override series colors
  };
}

// ============================================
// Main Entry Point
// ============================================

/**
 * Injects native Excel charts into an xlsx buffer.
 * Returns the modified buffer. Falls back to original on error.
 */
export async function injectCharts(
  xlsxBuffer: Buffer,
  charts: ChartDefinition[],
): Promise<Buffer> {
  if (!charts || charts.length === 0) return xlsxBuffer;

  try {
    const zip = await JSZip.loadAsync(xlsxBuffer);

    // Resolve sheet name → sheet index (1-based) from workbook.xml
    const sheetMap = await resolveSheetMap(zip);

    // Group charts by sheet
    const chartsBySheet = new Map<string, ChartDefinition[]>();
    for (const chart of charts) {
      const existing = chartsBySheet.get(chart.sheetName) || [];
      existing.push(chart);
      chartsBySheet.set(chart.sheetName, existing);
    }

    let chartCounter = 1;
    let drawingCounter = 1; // Sequential drawing numbering (not tied to sheet index)
    const drawingMap = new Map<number, number>(); // sheetIdx → drawingNum

    for (const [sheetName, sheetCharts] of chartsBySheet) {
      const sheetIdx = sheetMap.get(sheetName);
      if (sheetIdx === undefined) {
        console.warn(`[ChartInjector] Sheet "${sheetName}" not found, skipping charts`);
        continue;
      }

      const chartIds: number[] = [];
      const drawingNum = drawingCounter++;
      drawingMap.set(sheetIdx, drawingNum);

      // Create chart XML for each chart on this sheet
      for (const chart of sheetCharts) {
        const chartXml = buildChartXml(chart, chartCounter);
        zip.file(`xl/charts/chart${chartCounter}.xml`, chartXml);
        chartIds.push(chartCounter);
        chartCounter++;
      }

      // Create drawing with sequential numbering (drawing1.xml, drawing2.xml, ...)
      const drawingXml = buildDrawingXml(sheetCharts, chartIds);
      zip.file(`xl/drawings/drawing${drawingNum}.xml`, drawingXml);

      // Create drawing rels (links drawing → charts)
      const drawingRels = buildDrawingRels(chartIds);
      zip.file(`xl/drawings/_rels/drawing${drawingNum}.xml.rels`, drawingRels);

      // Link sheet → drawing
      await linkSheetToDrawing(zip, sheetIdx, drawingNum);
    }

    // Update [Content_Types].xml
    await updateContentTypesForCharts(zip, chartCounter - 1, drawingMap);

    const result = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    return Buffer.from(result);
  } catch (err) {
    console.error('[ChartInjector] Injection failed, returning original buffer:', err);
    return xlsxBuffer;
  }
}

// ============================================
// Sheet Resolution
// ============================================

/**
 * Parses xl/workbook.xml to build sheetName → sheetIndex map.
 */
async function resolveSheetMap(zip: JSZip): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  const wbFile = zip.file('xl/workbook.xml');
  if (!wbFile) return map;

  const xml = await wbFile.async('text');

  // Parse <sheet name="..." sheetId="..." r:id="rIdN"/> entries
  const sheetRegex = /<sheet\s[^>]*name="([^"]*)"[^>]*/g;
  let match;
  let idx = 1;
  while ((match = sheetRegex.exec(xml)) !== null) {
    map.set(match[1], idx);
    idx++;
  }

  return map;
}

// ============================================
// Chart XML Builders
// ============================================

function buildChartXml(chart: ChartDefinition, chartNum: number): string {
  const dark = chart.style?.darkTheme !== false; // Default to dark
  const bgColor = dark ? '1F2937' : 'FFFFFF';
  const textColor = dark ? 'E5E7EB' : '333333';
  const gridColor = dark ? '374151' : 'D1D5DB';

  let plotArea: string;
  switch (chart.type) {
    case 'bar':
      plotArea = buildBarPlotArea(chart, textColor, gridColor);
      break;
    case 'pie':
    case 'doughnut':
      plotArea = buildPiePlotArea(chart);
      break;
    case 'line':
      plotArea = buildLinePlotArea(chart, textColor, gridColor);
      break;
    default:
      plotArea = buildBarPlotArea(chart, textColor, gridColor);
  }

  const showLegend = chart.style?.showLegend !== false;
  const legendXml = showLegend ? `
    <c:legend>
      <c:legendPos val="b"/>
      <c:txPr>
        <a:bodyPr/>
        <a:lstStyle/>
        <a:p>
          <a:pPr>
            <a:defRPr sz="900">
              <a:solidFill><a:srgbClr val="${textColor}"/></a:solidFill>
            </a:defRPr>
          </a:pPr>
          <a:endParaRPr lang="en-US"/>
        </a:p>
      </c:txPr>
    </c:legend>` : '';

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart"
              xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
              xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <c:chart>
    <c:title>
      <c:tx>
        <c:rich>
          <a:bodyPr/>
          <a:lstStyle/>
          <a:p>
            <a:pPr>
              <a:defRPr sz="1200" b="1">
                <a:solidFill><a:srgbClr val="${textColor}"/></a:solidFill>
              </a:defRPr>
            </a:pPr>
            <a:r>
              <a:rPr lang="en-US" sz="1200" b="1">
                <a:solidFill><a:srgbClr val="${textColor}"/></a:solidFill>
              </a:rPr>
              <a:t>${escapeXml(chart.title)}</a:t>
            </a:r>
          </a:p>
        </c:rich>
      </c:tx>
      <c:overlay val="0"/>
    </c:title>
    <c:autoTitleDeleted val="0"/>
    ${plotArea}
    ${legendXml}
    <c:plotVisOnly val="1"/>
  </c:chart>
  <c:spPr>
    <a:solidFill><a:srgbClr val="${bgColor}"/></a:solidFill>
    <a:ln><a:noFill/></a:ln>
  </c:spPr>
</c:chartSpace>`;
}

function buildBarPlotArea(chart: ChartDefinition, textColor: string, gridColor: string): string {
  const series = chart.dataRange.values.map((s, i) => {
    const color = s.color || getDefaultColor(i, chart.style?.colors);
    return `
      <c:ser>
        <c:idx val="${i}"/>
        <c:order val="${i}"/>
        <c:tx><c:strRef><c:f>"${escapeXml(s.name)}"</c:f></c:strRef></c:tx>
        <c:spPr>
          <a:solidFill><a:srgbClr val="${color}"/></a:solidFill>
          <a:ln><a:noFill/></a:ln>
        </c:spPr>
        <c:cat><c:strRef><c:f>${escapeXml(chart.dataRange.categories)}</c:f></c:strRef></c:cat>
        <c:val><c:numRef><c:f>${escapeXml(s.ref)}</c:f></c:numRef></c:val>
      </c:ser>`;
  }).join('');

  return `
    <c:plotArea>
      <c:layout/>
      <c:barChart>
        <c:barDir val="col"/>
        <c:grouping val="clustered"/>
        <c:varyColors val="1"/>
        ${series}
        <c:axId val="1"/>
        <c:axId val="2"/>
      </c:barChart>
      <c:catAx>
        <c:axId val="1"/>
        <c:scaling><c:orientation val="minMax"/></c:scaling>
        <c:delete val="0"/>
        <c:axPos val="b"/>
        <c:txPr>
          <a:bodyPr rot="-2700000"/>
          <a:lstStyle/>
          <a:p>
            <a:pPr>
              <a:defRPr sz="800">
                <a:solidFill><a:srgbClr val="${textColor}"/></a:solidFill>
              </a:defRPr>
            </a:pPr>
            <a:endParaRPr lang="en-US"/>
          </a:p>
        </c:txPr>
        <c:crossAx val="2"/>
      </c:catAx>
      <c:valAx>
        <c:axId val="2"/>
        <c:scaling><c:orientation val="minMax"/></c:scaling>
        <c:delete val="0"/>
        <c:axPos val="l"/>
        <c:majorGridlines>
          <c:spPr>
            <a:ln w="3175">
              <a:solidFill><a:srgbClr val="${gridColor}"/></a:solidFill>
            </a:ln>
          </c:spPr>
        </c:majorGridlines>
        <c:txPr>
          <a:bodyPr/>
          <a:lstStyle/>
          <a:p>
            <a:pPr>
              <a:defRPr sz="800">
                <a:solidFill><a:srgbClr val="${textColor}"/></a:solidFill>
              </a:defRPr>
            </a:pPr>
            <a:endParaRPr lang="en-US"/>
          </a:p>
        </c:txPr>
        <c:crossAx val="1"/>
      </c:valAx>
      <c:spPr>
        <a:noFill/>
      </c:spPr>
    </c:plotArea>`;
}

function buildPiePlotArea(chart: ChartDefinition): string {
  const isDoughnut = chart.type === 'doughnut';
  const tagName = isDoughnut ? 'c:doughnutChart' : 'c:pieChart';

  // For pie/doughnut, use the first series and vary colors by point
  const s = chart.dataRange.values[0];
  const colors = chart.style?.colors || DEFAULT_COLORS;

  // Build per-point color overrides for up to 10 data points
  const dataPoints = colors.slice(0, 10).map((color, i) => `
        <c:dPt>
          <c:idx val="${i}"/>
          <c:spPr>
            <a:solidFill><a:srgbClr val="${color}"/></a:solidFill>
          </c:spPr>
        </c:dPt>`).join('');

  return `
    <c:plotArea>
      <c:layout/>
      <${tagName}>
        <c:varyColors val="1"/>
        <c:ser>
          <c:idx val="0"/>
          <c:order val="0"/>
          <c:tx><c:strRef><c:f>"${escapeXml(s.name)}"</c:f></c:strRef></c:tx>
          ${dataPoints}
          <c:cat><c:strRef><c:f>${escapeXml(chart.dataRange.categories)}</c:f></c:strRef></c:cat>
          <c:val><c:numRef><c:f>${escapeXml(s.ref)}</c:f></c:numRef></c:val>
        </c:ser>
        ${isDoughnut ? '<c:holeSize val="50"/>' : ''}
      </${tagName}>
    </c:plotArea>`;
}

function buildLinePlotArea(chart: ChartDefinition, textColor: string, gridColor: string): string {
  const series = chart.dataRange.values.map((s, i) => {
    const color = s.color || getDefaultColor(i, chart.style?.colors);
    return `
      <c:ser>
        <c:idx val="${i}"/>
        <c:order val="${i}"/>
        <c:tx><c:strRef><c:f>"${escapeXml(s.name)}"</c:f></c:strRef></c:tx>
        <c:spPr>
          <a:ln w="22225">
            <a:solidFill><a:srgbClr val="${color}"/></a:solidFill>
          </a:ln>
        </c:spPr>
        <c:marker>
          <c:symbol val="circle"/>
          <c:size val="4"/>
          <c:spPr>
            <a:solidFill><a:srgbClr val="${color}"/></a:solidFill>
          </c:spPr>
        </c:marker>
        <c:cat><c:strRef><c:f>${escapeXml(chart.dataRange.categories)}</c:f></c:strRef></c:cat>
        <c:val><c:numRef><c:f>${escapeXml(s.ref)}</c:f></c:numRef></c:val>
      </c:ser>`;
  }).join('');

  return `
    <c:plotArea>
      <c:layout/>
      <c:lineChart>
        <c:grouping val="standard"/>
        <c:varyColors val="0"/>
        ${series}
        <c:marker val="1"/>
        <c:axId val="1"/>
        <c:axId val="2"/>
      </c:lineChart>
      <c:catAx>
        <c:axId val="1"/>
        <c:scaling><c:orientation val="minMax"/></c:scaling>
        <c:delete val="0"/>
        <c:axPos val="b"/>
        <c:txPr>
          <a:bodyPr rot="-2700000"/>
          <a:lstStyle/>
          <a:p>
            <a:pPr>
              <a:defRPr sz="800">
                <a:solidFill><a:srgbClr val="${textColor}"/></a:solidFill>
              </a:defRPr>
            </a:pPr>
            <a:endParaRPr lang="en-US"/>
          </a:p>
        </c:txPr>
        <c:crossAx val="2"/>
      </c:catAx>
      <c:valAx>
        <c:axId val="2"/>
        <c:scaling><c:orientation val="minMax"/></c:scaling>
        <c:delete val="0"/>
        <c:axPos val="l"/>
        <c:majorGridlines>
          <c:spPr>
            <a:ln w="3175">
              <a:solidFill><a:srgbClr val="${gridColor}"/></a:solidFill>
            </a:ln>
          </c:spPr>
        </c:majorGridlines>
        <c:txPr>
          <a:bodyPr/>
          <a:lstStyle/>
          <a:p>
            <a:pPr>
              <a:defRPr sz="800">
                <a:solidFill><a:srgbClr val="${textColor}"/></a:solidFill>
              </a:defRPr>
            </a:pPr>
            <a:endParaRPr lang="en-US"/>
          </a:p>
        </c:txPr>
        <c:crossAx val="1"/>
      </c:valAx>
      <c:spPr>
        <a:noFill/>
      </c:spPr>
    </c:plotArea>`;
}

// ============================================
// Drawing XML (Positioning)
// ============================================

/**
 * Builds drawing XML with twoCellAnchor for each chart on a sheet.
 */
function buildDrawingXml(charts: ChartDefinition[], chartIds: number[]): string {
  const anchors = charts.map((chart, i) => {
    const p = chart.position;
    return `
  <xdr:twoCellAnchor editAs="oneCell">
    <xdr:from>
      <xdr:col>${p.fromCol}</xdr:col>
      <xdr:colOff>0</xdr:colOff>
      <xdr:row>${p.fromRow}</xdr:row>
      <xdr:rowOff>0</xdr:rowOff>
    </xdr:from>
    <xdr:to>
      <xdr:col>${p.toCol}</xdr:col>
      <xdr:colOff>0</xdr:colOff>
      <xdr:row>${p.toRow}</xdr:row>
      <xdr:rowOff>0</xdr:rowOff>
    </xdr:to>
    <xdr:graphicFrame macro="">
      <xdr:nvGraphicFramePr>
        <xdr:cNvPr id="${i + 2}" name="Chart ${chartIds[i]}"/>
        <xdr:cNvGraphicFramePr>
          <a:graphicFrameLocks noGrp="1"/>
        </xdr:cNvGraphicFramePr>
      </xdr:nvGraphicFramePr>
      <xdr:xfrm>
        <a:off x="0" y="0"/>
        <a:ext cx="0" cy="0"/>
      </xdr:xfrm>
      <a:graphic>
        <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart">
          <c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart"
                   xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
                   r:id="rId${i + 1}"/>
        </a:graphicData>
      </a:graphic>
    </xdr:graphicFrame>
    <xdr:clientData/>
  </xdr:twoCellAnchor>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing"
          xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
          xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
${anchors}
</xdr:wsDr>`;
}

/**
 * Builds drawing relationships (drawing → chart references).
 */
function buildDrawingRels(chartIds: number[]): string {
  const rels = chartIds.map((chartId, i) =>
    `  <Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="../charts/chart${chartId}.xml"/>`
  ).join('\n');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${rels}
</Relationships>`;
}

// ============================================
// ZIP Part Updaters
// ============================================

/**
 * Links a worksheet to its drawing via sheet rels.
 */
async function linkSheetToDrawing(zip: JSZip, sheetIdx: number, drawingNum: number): Promise<void> {
  const relsPath = `xl/worksheets/_rels/sheet${sheetIdx}.xml.rels`;
  let xml: string;
  const existingFile = zip.file(relsPath);

  if (existingFile) {
    xml = await existingFile.async('text');

    // Check if drawing rel already exists
    if (xml.includes('relationships/drawing')) return;

    // Find highest rId
    const rIdMatches = xml.match(/rId(\d+)/g) || [];
    let maxId = 0;
    for (const m of rIdMatches) {
      const num = parseInt(m.replace('rId', ''), 10);
      if (num > maxId) maxId = num;
    }

    const drawingRel = `  <Relationship Id="rId${maxId + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing${drawingNum}.xml"/>`;
    xml = xml.replace('</Relationships>', `${drawingRel}\n</Relationships>`);
  } else {
    xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing${drawingNum}.xml"/>
</Relationships>`;
  }

  zip.file(relsPath, xml);

  // Also add <drawing r:id="rIdN"/> to the sheet XML if not present
  const sheetPath = `xl/worksheets/sheet${sheetIdx}.xml`;
  const sheetFile = zip.file(sheetPath);
  if (sheetFile) {
    let sheetXml = await sheetFile.async('text');
    if (!sheetXml.includes('<drawing')) {
      // Find the rId we just used
      const drawingRIdMatch = xml.match(/Id="(rId\d+)"[^>]*relationships\/drawing/);
      const rId = drawingRIdMatch ? drawingRIdMatch[1] : 'rId1';

      const drawingTag = `<drawing r:id="${rId}"/>`;

      // Insert <drawing> at correct position per OOXML spec:
      // after conditionalFormatting/hyperlinks/pageMargins/etc, before tableParts/extLst
      if (sheetXml.includes('<tableParts')) {
        sheetXml = sheetXml.replace('<tableParts', `${drawingTag}<tableParts`);
      } else if (sheetXml.includes('<extLst')) {
        sheetXml = sheetXml.replace('<extLst', `${drawingTag}<extLst`);
      } else {
        sheetXml = sheetXml.replace('</worksheet>', `${drawingTag}</worksheet>`);
      }
      zip.file(sheetPath, sheetXml);
    }
  }
}

/**
 * Updates [Content_Types].xml to register chart and drawing types.
 */
async function updateContentTypesForCharts(
  zip: JSZip,
  totalCharts: number,
  drawingMap: Map<number, number>,
): Promise<void> {
  const ctFile = zip.file('[Content_Types].xml');
  if (!ctFile) return;

  let xml = await ctFile.async('text');

  // Add chart overrides
  for (let i = 1; i <= totalCharts; i++) {
    const override = `<Override PartName="/xl/charts/chart${i}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>`;
    if (!xml.includes(`/xl/charts/chart${i}.xml`)) {
      xml = xml.replace('</Types>', `  ${override}\n</Types>`);
    }
  }

  // Add drawing overrides (sequential numbering)
  for (const [, drawingNum] of drawingMap) {
    const override = `<Override PartName="/xl/drawings/drawing${drawingNum}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>`;
    if (!xml.includes(`/xl/drawings/drawing${drawingNum}.xml`)) {
      xml = xml.replace('</Types>', `  ${override}\n</Types>`);
    }
  }

  zip.file('[Content_Types].xml', xml);
}

// ============================================
// Utilities
// ============================================

const DEFAULT_COLORS = [
  '10B981', '3B82F6', 'F59E0B', 'EF4444', '8B5CF6',
  'EC4899', '14B8A6', 'F97316', '6366F1', '84CC16',
];

function getDefaultColor(index: number, overrideColors?: string[]): string {
  const colors = overrideColors || DEFAULT_COLORS;
  return colors[index % colors.length];
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
