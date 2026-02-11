/**
 * Power Query Injector — Load to Table
 *
 * Post-processes an ExcelJS-generated xlsx buffer to inject real Power Query
 * connections that LOAD DATA INTO EXCEL TABLES (not just "Connection Only").
 *
 * After injection, Excel recognizes the queries as native data connections.
 * Users paste their API key and hit Refresh All — tables populate with live data.
 *
 * xlsx files are ZIP archives. The complete OOXML structure needed:
 * - customXml/item1.xml              → DataMashup binary (base64-wrapped)
 * - customXml/itemProps1.xml          → Properties for the custom XML part
 * - xl/connections.xml                → Connection definitions (OLEDB type=5)
 * - xl/tables/tableN.xml             → Excel Table definitions per query
 * - xl/queryTables/queryTableN.xml   → QueryTable linking connection→table
 * - xl/worksheets/_rels/sheetM.xml.rels → Sheet→table + sheet→queryTable rels
 * - [Content_Types].xml              → Updated with all new part types
 * - xl/_rels/workbook.xml.rels       → Relationship to connections.xml
 * - _rels/.rels                      → Relationship to customXml
 *
 * Relationship chain:
 *   DataMashup (M formula) → Connection → QueryTable → Table → Sheet (tableParts)
 *
 * BYOK: All M code calls CoinGecko directly with user's API key.
 * Server never touches CoinGecko data.
 */

import JSZip from 'jszip';

export interface PowerQueryDefinition {
  name: string;
  code: string;
  description: string;
  /** Column names the PQ M code outputs (required for Load-to-Table) */
  columns?: string[];
  /** Sheet name where the PQ table lives (created by masterGenerator) */
  targetSheet?: string;
}

/**
 * Info about a PQ data sheet created by ExcelJS, needed for OOXML injection.
 */
export interface PQSheetMapping {
  queryName: string;
  sheetName: string;
  columns: string[];
  dataRowCount: number;
}

/**
 * Main entry point: injects Power Query connections into an xlsx buffer.
 * When sheetMappings are provided, creates Load-to-Table (not Connection Only).
 * Returns the modified buffer. Falls back to original on error.
 */
export async function injectPowerQueries(
  xlsxBuffer: Buffer,
  queries: PowerQueryDefinition[],
  sheetMappings?: PQSheetMapping[]
): Promise<Buffer> {
  if (!queries || queries.length === 0) return xlsxBuffer;

  const loadToTable = sheetMappings && sheetMappings.length > 0;

  try {
    const zip = await JSZip.loadAsync(xlsxBuffer);

    // 1. Build and inject DataMashup
    const dataMashup = buildDataMashup(queries, loadToTable || false);
    const dataMashupBase64 = Buffer.from(dataMashup).toString('base64');
    zip.file('customXml/item1.xml', buildCustomXmlItem(dataMashupBase64));
    zip.file('customXml/itemProps1.xml', buildCustomXmlItemProps());

    // 2. Build and inject connections.xml (with refreshOnLoad + saveData if loading to table)
    zip.file('xl/connections.xml', buildConnectionsXml(queries, loadToTable || false));

    // 3. Update [Content_Types].xml
    await updateContentTypes(zip, sheetMappings);

    // 4. Update xl/_rels/workbook.xml.rels
    await updateWorkbookRels(zip);

    // 5. Update _rels/.rels
    await updateRootRels(zip);

    // 6. If Load-to-Table: inject table + queryTable XML and update sheet rels
    if (loadToTable && sheetMappings) {
      await injectTableParts(zip, queries, sheetMappings);
    }

    // Generate the modified xlsx
    const result = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    return Buffer.from(result);
  } catch (err) {
    console.error('[PowerQueryInjector] Injection failed, returning original buffer:', err);
    return xlsxBuffer;
  }
}

// ============================================
// DataMashup Binary Construction
// ============================================

/**
 * Builds the DataMashup binary blob per MS-QDEFF spec.
 * Format:
 *   Version (4 bytes LE, value = 0)
 *   PackagePartsLength (4 bytes LE)
 *   PackageParts (inner ZIP)
 *   PermissionsLength (4 bytes LE)
 *   PermissionsBlob
 *   MetadataLength (4 bytes LE)
 *   MetadataBlob
 */
function buildDataMashup(queries: PowerQueryDefinition[], loadToTable: boolean): Uint8Array {
  const packageZip = buildPackageZip(queries, loadToTable);

  const permissionsXml = buildPermissionsXml();
  const permissionsBytes = new TextEncoder().encode(permissionsXml);

  const metadataXml = buildMetadataXml(queries);
  const metadataBytes = new TextEncoder().encode(metadataXml);

  const totalSize = 4 + 4 + packageZip.length + 4 + permissionsBytes.length + 4 + metadataBytes.length;
  const buffer = new Uint8Array(totalSize);
  const view = new DataView(buffer.buffer);

  let offset = 0;

  // Version = 0
  view.setUint32(offset, 0, true);
  offset += 4;

  // Package ZIP size + data
  view.setUint32(offset, packageZip.length, true);
  offset += 4;
  buffer.set(packageZip, offset);
  offset += packageZip.length;

  // Permissions size + data
  view.setUint32(offset, permissionsBytes.length, true);
  offset += 4;
  buffer.set(permissionsBytes, offset);
  offset += permissionsBytes.length;

  // Metadata size + data
  view.setUint32(offset, metadataBytes.length, true);
  offset += 4;
  buffer.set(metadataBytes, offset);

  return buffer;
}

/**
 * Builds the inner Package ZIP containing:
 * - Config/Package.xml (query declarations with FillObjectType)
 * - Formulas/Section1.m (M code per query)
 */
function buildPackageZip(queries: PowerQueryDefinition[], loadToTable: boolean): Uint8Array {
  const packageXml = buildPackageXml(queries, loadToTable);
  const sectionM = buildSectionM(queries);

  const contentTypesXml = `<?xml version="1.0" encoding="utf-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="xml" ContentType="text/xml" />
  <Default Extension="m" ContentType="application/x-ms-m" />
</Types>`;

  return createMinimalZip({
    '[Content_Types].xml': new TextEncoder().encode(contentTypesXml),
    'Config/Package.xml': new TextEncoder().encode(packageXml),
    'Formulas/Section1.m': new TextEncoder().encode(sectionM),
  });
}

/**
 * Package.xml declares each query in the DataMashup package.
 * When loadToTable=true, FillObjectType=sTable (loads into Excel Table).
 * When loadToTable=false, FillObjectType=sConnectionOnly (sidebar only).
 */
function buildPackageXml(queries: PowerQueryDefinition[], loadToTable: boolean): string {
  const fillType = loadToTable ? 'sTable' : 'sConnectionOnly';
  const extraEntries = loadToTable
    ? `
        <Entry Type="FillToDataModelEnabled" Value="l0" />
        <Entry Type="BufferNextRefresh" Value="l1" />
        <Entry Type="FilledCompleteResultToWorksheet" Value="l1" />
        <Entry Type="AddedToDataModel" Value="l0" />`
    : '';

  const items = queries.map(q => `    <Item>
      <ItemLocation>
        <ItemType>Formula</ItemType>
        <ItemPath>Section1.m</ItemPath>
      </ItemLocation>
      <StableEntries>
        <Entry Type="IsPrivate" Value="l0" />
        <Entry Type="FillEnabled" Value="l1" />
        <Entry Type="ResultType" Value="sTable" />
        <Entry Type="NameUpdatedAfterFill" Value="l0" />
        <Entry Type="NavigationStepName" Value="sNavigation" />
        <Entry Type="FillObjectType" Value="${fillType}" />
        <Entry Type="FillTarget" Value="s${q.name}" />
        <Entry Type="Name" Value="s${q.name}" />${extraEntries}
      </StableEntries>
    </Item>`).join('\n');

  return `<?xml version="1.0" encoding="utf-8"?>
<Package xmlns="http://schemas.microsoft.com/DataMashup">
  <Version>2.72.0</Version>
  <MinVersion>2.21.0</MinVersion>
  <Culture>en-US</Culture>
  <SafeCombine>true</SafeCombine>
  <Items>
${items}
  </Items>
</Package>`;
}

/**
 * Section1.m contains all query definitions in M language.
 */
function buildSectionM(queries: PowerQueryDefinition[]): string {
  const lines = ['section Section1;', ''];
  for (const q of queries) {
    lines.push(`shared ${q.name} = ${q.code.trim()};`);
    lines.push('');
  }
  return lines.join('\n');
}

/**
 * Permissions XML grants Web.Contents access to API domains.
 */
function buildPermissionsXml(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<PermissionList xmlns="http://schemas.microsoft.com/DataMashup/Permission">
  <PermissionEntry>
    <ResourcePath>https://api.coingecko.com</ResourcePath>
    <PermissionKind>Read</PermissionKind>
    <AuthenticationKind>Anonymous</AuthenticationKind>
    <PrivacySetting>Public</PrivacySetting>
  </PermissionEntry>
  <PermissionEntry>
    <ResourcePath>https://pro-api.coingecko.com</ResourcePath>
    <PermissionKind>Read</PermissionKind>
    <AuthenticationKind>Anonymous</AuthenticationKind>
    <PrivacySetting>Public</PrivacySetting>
  </PermissionEntry>
  <PermissionEntry>
    <ResourcePath>https://api.alternative.me</ResourcePath>
    <PermissionKind>Read</PermissionKind>
    <AuthenticationKind>Anonymous</AuthenticationKind>
    <PrivacySetting>Public</PrivacySetting>
  </PermissionEntry>
</PermissionList>`;
}

/**
 * Metadata XML with content type definitions.
 */
function buildMetadataXml(queries: PowerQueryDefinition[]): string {
  const items = queries.map(() =>
    `    <Item><ItemLocation><ItemType>Formula</ItemType><ItemPath>Section1.m</ItemPath></ItemLocation></Item>`
  ).join('\n');

  return `<?xml version="1.0" encoding="utf-8"?>
<Metadata xmlns="http://schemas.microsoft.com/DataMashup/Metadata">
  <Items>
${items}
  </Items>
</Metadata>`;
}

// ============================================
// Table + QueryTable OOXML Injection
// ============================================

/**
 * Injects Excel Table + QueryTable OOXML parts for each PQ sheet mapping.
 * This is what makes PQ "Load to Table" work — creating the full chain:
 *   Connection → QueryTable → Table → Sheet (tableParts)
 */
async function injectTableParts(
  zip: JSZip,
  queries: PowerQueryDefinition[],
  mappings: PQSheetMapping[]
): Promise<void> {
  // Build a map of sheet name → sheet number by scanning the ZIP
  const sheetMap = await buildSheetNumberMap(zip);

  for (let i = 0; i < mappings.length; i++) {
    const mapping = mappings[i];
    const queryIndex = queries.findIndex(q => q.name === mapping.queryName);
    if (queryIndex === -1) continue;

    const connectionId = queryIndex + 1; // connections.xml uses 1-based IDs
    const tableNum = i + 1;              // table1, table2, etc.
    const sheetNum = sheetMap[mapping.sheetName];
    if (!sheetNum) {
      console.warn(`[PQ] Sheet "${mapping.sheetName}" not found in ZIP, skipping table injection`);
      continue;
    }

    const cols = mapping.columns;
    const rowCount = Math.max(mapping.dataRowCount, 1);
    // Table range: A1 to (lastCol)(lastRow+1) — row 1 = headers, row 2+ = data
    const lastColLetter = colLetter(cols.length);
    const tableRef = `A1:${lastColLetter}${rowCount + 1}`;

    // 1. Create xl/tables/tableN.xml
    zip.file(`xl/tables/table${tableNum}.xml`, buildTableXml(
      tableNum, mapping.queryName, tableRef, cols
    ));

    // 2. Create xl/queryTables/queryTableN.xml
    zip.file(`xl/queryTables/queryTable${tableNum}.xml`, buildQueryTableXml(
      connectionId, cols
    ));

    // 3. Create/update sheet rels to link sheet → table + queryTable
    await addSheetTableRels(zip, sheetNum, tableNum);

    // 4. Update sheet XML to add <tableParts>
    await addTablePartsToSheet(zip, sheetNum);

    // 5. Add definedName for ExternalData in workbook.xml
    await addDefinedName(zip, sheetNum, mapping.sheetName, tableRef, i + 1);
  }
}

/**
 * Builds a map of sheet name → sheet file number by reading workbook.xml
 * and workbook.xml.rels from the ZIP.
 */
async function buildSheetNumberMap(zip: JSZip): Promise<Record<string, number>> {
  const map: Record<string, number> = {};

  const wbFile = zip.file('xl/workbook.xml');
  const relsFile = zip.file('xl/_rels/workbook.xml.rels');
  if (!wbFile || !relsFile) return map;

  const wbXml = await wbFile.async('text');
  const relsXml = await relsFile.async('text');

  // Extract sheet entries: <sheet name="..." sheetId="..." r:id="rIdN"/>
  const sheetRegex = /<sheet\s+[^>]*name="([^"]+)"[^>]*r:id="([^"]+)"[^>]*\/>/g;
  const sheets: { name: string; rId: string }[] = [];
  let match;
  while ((match = sheetRegex.exec(wbXml)) !== null) {
    sheets.push({ name: match[1], rId: match[2] });
  }

  // Extract relationship targets: <Relationship Id="rIdN" ... Target="worksheets/sheetM.xml"/>
  const relRegex = /<Relationship\s+[^>]*Id="([^"]+)"[^>]*Target="worksheets\/sheet(\d+)\.xml"[^>]*\/>/g;
  const relMap: Record<string, number> = {};
  while ((match = relRegex.exec(relsXml)) !== null) {
    relMap[match[1]] = parseInt(match[2], 10);
  }

  // Map: sheet name → sheet number
  for (const s of sheets) {
    if (relMap[s.rId]) {
      map[s.name] = relMap[s.rId];
    }
  }

  return map;
}

/**
 * Generates xl/tables/tableN.xml
 * Defines an Excel Table linked to a Power Query via queryTableFieldId.
 */
function buildTableXml(tableNum: number, queryName: string, ref: string, columns: string[]): string {
  const tableName = queryName.replace(/[^a-zA-Z0-9_]/g, '_');
  const colsXml = columns.map((col, i) => {
    const id = i + 1;
    return `    <tableColumn id="${id}" uniqueName="${id}" name="${escapeXml(col)}" queryTableFieldId="${id}" />`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<table xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
  id="${tableNum}" name="${tableName}" displayName="${tableName}" ref="${ref}"
  tableType="queryTable" totalsRowShown="0" connectionId="${tableNum}">
  <autoFilter ref="${ref}" />
  <tableColumns count="${columns.length}">
${colsXml}
  </tableColumns>
  <tableStyleInfo name="TableStyleMedium9" showFirstColumn="0"
    showLastColumn="0" showRowStripes="1" showColumnStripes="0" />
</table>`;
}

/**
 * Generates xl/queryTables/queryTableN.xml
 * Links the connection to the Excel Table with column mappings.
 */
function buildQueryTableXml(connectionId: number, columns: string[]): string {
  const fieldsXml = columns.map((col, i) => {
    const id = i + 1;
    return `      <queryTableField id="${id}" name="${escapeXml(col)}" tableColumnId="${id}" />`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<queryTable xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
  name="ExternalData_${connectionId}" connectionId="${connectionId}"
  autoFormatId="16" applyNumberFormats="0" applyBorderFormats="0"
  applyFontFormats="0" applyPatternFormats="0" applyAlignmentFormats="0"
  applyWidthHeightFormats="0" refreshOnLoad="1" growShrinkType="insertDelete">
  <queryTableRefresh nextId="${columns.length + 1}">
    <queryTableFields count="${columns.length}">
${fieldsXml}
    </queryTableFields>
  </queryTableRefresh>
</queryTable>`;
}

/**
 * Adds table + queryTable relationships to a sheet's .rels file.
 */
async function addSheetTableRels(zip: JSZip, sheetNum: number, tableNum: number): Promise<void> {
  const relsPath = `xl/worksheets/_rels/sheet${sheetNum}.xml.rels`;
  const existing = zip.file(relsPath);
  let xml: string;

  if (existing) {
    xml = await existing.async('text');
    // Find highest existing rId
    const rIdMatches = xml.match(/rId(\d+)/g) || [];
    let maxId = 0;
    for (const m of rIdMatches) {
      const num = parseInt(m.replace('rId', ''), 10);
      if (num > maxId) maxId = num;
    }

    const tableRel = `<Relationship Id="rId${maxId + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/table" Target="../tables/table${tableNum}.xml" />`;
    const qtRel = `<Relationship Id="rId${maxId + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/queryTable" Target="../queryTables/queryTable${tableNum}.xml" />`;

    xml = xml.replace('</Relationships>', `  ${tableRel}\n  ${qtRel}\n</Relationships>`);
  } else {
    xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/table" Target="../tables/table${tableNum}.xml" />
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/queryTable" Target="../queryTables/queryTable${tableNum}.xml" />
</Relationships>`;
  }

  zip.file(relsPath, xml);
}

/**
 * Adds <tableParts> to sheet XML. This tells Excel the sheet has a table.
 */
async function addTablePartsToSheet(zip: JSZip, sheetNum: number): Promise<void> {
  const sheetPath = `xl/worksheets/sheet${sheetNum}.xml`;
  const sheetFile = zip.file(sheetPath);
  if (!sheetFile) return;

  let xml = await sheetFile.async('text');

  // Skip if already has tableParts
  if (xml.includes('<tableParts')) return;

  // The rId for the table relationship (first rel we added = rId1 for new, or calculated)
  // Read the rels file to find the table rId
  const relsPath = `xl/worksheets/_rels/sheet${sheetNum}.xml.rels`;
  const relsFile = zip.file(relsPath);
  let tableRId = 'rId1';
  if (relsFile) {
    const relsXml = await relsFile.async('text');
    const tableMatch = relsXml.match(/Id="(rId\d+)"[^>]*Type="[^"]*\/table"/);
    if (tableMatch) tableRId = tableMatch[1];
  }

  // Insert tableParts before </worksheet>
  const tableParts = `<tableParts count="1"><tablePart r:id="${tableRId}"/></tableParts>`;
  xml = xml.replace('</worksheet>', `${tableParts}</worksheet>`);

  // Ensure r: namespace is declared on worksheet element
  if (!xml.includes('xmlns:r=')) {
    xml = xml.replace('<worksheet', '<worksheet xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"');
  }

  zip.file(sheetPath, xml);
}

/**
 * Adds a definedName for ExternalData in workbook.xml.
 * This is required for PQ table connections.
 */
async function addDefinedName(
  zip: JSZip, sheetNum: number, sheetName: string, ref: string, index: number
): Promise<void> {
  const wbFile = zip.file('xl/workbook.xml');
  if (!wbFile) return;

  let xml = await wbFile.async('text');

  // localSheetId is 0-based sheet index
  const localSheetId = sheetNum - 1;
  const escapedName = sheetName.replace(/'/g, "''");
  const definedName = `<definedName name="ExternalData_${index}" localSheetId="${localSheetId}" hidden="1">'${escapedName}'!$${ref.replace(':', ':$').replace(/([A-Z]+)(\d+)/g, '$$$1$$$2')}</definedName>`;

  if (xml.includes('<definedNames')) {
    // Add to existing definedNames
    xml = xml.replace('</definedNames>', `  ${definedName}\n</definedNames>`);
  } else {
    // Create definedNames section before </workbook>
    xml = xml.replace('</workbook>', `<definedNames>${definedName}</definedNames></workbook>`);
  }

  zip.file('xl/workbook.xml', xml);
}

// ============================================
// connections.xml
// ============================================

/**
 * xl/connections.xml defines one connection per Power Query.
 * type="5" = OleDb (used for Power Query connections)
 * When loadToTable=true, adds saveData="1" and refreshOnLoad="1"
 */
function buildConnectionsXml(queries: PowerQueryDefinition[], loadToTable: boolean): string {
  const connections = queries.map((q, i) => {
    const connId = i + 1;
    const saveData = loadToTable ? ' saveData="1"' : '';
    const refreshOnLoad = loadToTable ? ' refreshOnLoad="1"' : '';
    return `  <connection id="${connId}" keepAlive="1" name="Query - ${q.name}" description="${escapeXml(q.description)}" type="5" refreshedVersion="6" background="1"${saveData}>
    <dbPr connection="Provider=Microsoft.Mashup.OleDb.1;Data Source=$Workbook$;Location=&quot;${q.name}&quot;;" command="SELECT * FROM [${q.name}]"${refreshOnLoad} />
  </connection>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<connections xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
${connections}
</connections>`;
}

// ============================================
// ZIP Part Updaters
// ============================================

/**
 * Updates [Content_Types].xml to include all new OOXML parts.
 */
async function updateContentTypes(zip: JSZip, sheetMappings?: PQSheetMapping[]): Promise<void> {
  const ctFile = zip.file('[Content_Types].xml');
  if (!ctFile) return;

  let xml = await ctFile.async('text');

  // Base overrides (always needed)
  const overrides = [
    '<Override PartName="/customXml/item1.xml" ContentType="application/xml" />',
    '<Override PartName="/customXml/itemProps1.xml" ContentType="application/vnd.openxmlformats-officedocument.customXmlProperties+xml" />',
    '<Override PartName="/xl/connections.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.connections+xml" />',
  ];

  // Table + queryTable overrides for each mapping
  if (sheetMappings) {
    for (let i = 0; i < sheetMappings.length; i++) {
      const num = i + 1;
      overrides.push(
        `<Override PartName="/xl/tables/table${num}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml" />`
      );
      overrides.push(
        `<Override PartName="/xl/queryTables/queryTable${num}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.queryTable+xml" />`
      );
    }
  }

  for (const override of overrides) {
    if (!xml.includes(override)) {
      xml = xml.replace('</Types>', `  ${override}\n</Types>`);
    }
  }

  zip.file('[Content_Types].xml', xml);
}

/**
 * Updates xl/_rels/workbook.xml.rels to reference connections.xml and customXml.
 */
async function updateWorkbookRels(zip: JSZip): Promise<void> {
  const relsFile = zip.file('xl/_rels/workbook.xml.rels');
  if (!relsFile) return;

  let xml = await relsFile.async('text');

  const rIdMatches = xml.match(/rId(\d+)/g) || [];
  let maxId = 0;
  for (const m of rIdMatches) {
    const num = parseInt(m.replace('rId', ''), 10);
    if (num > maxId) maxId = num;
  }

  const connRel = `<Relationship Id="rId${maxId + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/connections" Target="connections.xml" />`;
  const pqRel = `<Relationship Id="rId${maxId + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/customXml" Target="../customXml/item1.xml" />`;

  if (!xml.includes('relationships/connections')) {
    xml = xml.replace('</Relationships>', `  ${connRel}\n</Relationships>`);
  }
  if (!xml.includes('customXml/item1.xml')) {
    xml = xml.replace('</Relationships>', `  ${pqRel}\n</Relationships>`);
  }

  zip.file('xl/_rels/workbook.xml.rels', xml);
}

/**
 * Updates _rels/.rels to include the customXml relationship.
 */
async function updateRootRels(zip: JSZip): Promise<void> {
  const relsFile = zip.file('_rels/.rels');
  if (!relsFile) return;

  let xml = await relsFile.async('text');

  const rIdMatches = xml.match(/rId(\d+)/g) || [];
  let maxId = 0;
  for (const m of rIdMatches) {
    const num = parseInt(m.replace('rId', ''), 10);
    if (num > maxId) maxId = num;
  }

  const cxRel = `<Relationship Id="rId${maxId + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/customXml" Target="customXml/item1.xml" />`;

  if (!xml.includes('customXml/item1.xml')) {
    xml = xml.replace('</Relationships>', `  ${cxRel}\n</Relationships>`);
  }

  zip.file('customXml/_rels/item1.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/customXmlProps" Target="itemProps1.xml" />
</Relationships>`);

  zip.file('_rels/.rels', xml);
}

// ============================================
// Minimal Synchronous ZIP Builder
// ============================================

/**
 * Creates a minimal uncompressed ZIP file from a map of path→data.
 * This is needed because the DataMashup inner package must be built
 * synchronously as part of the binary blob construction.
 */
function createMinimalZip(files: Record<string, Uint8Array>): Uint8Array {
  const entries = Object.entries(files);
  const parts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let localOffset = 0;

  for (const [path, data] of entries) {
    const nameBytes = new TextEncoder().encode(path);
    const crc = crc32(data);

    // Local file header (30 bytes + name + data)
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true);  // Local file header signature
    lv.setUint16(4, 20, true);           // Version needed to extract
    lv.setUint16(6, 0, true);            // General purpose bit flag
    lv.setUint16(8, 0, true);            // Compression method (stored)
    lv.setUint16(10, 0, true);           // Last mod file time
    lv.setUint16(12, 0, true);           // Last mod file date
    lv.setUint32(14, crc, true);         // CRC-32
    lv.setUint32(18, data.length, true); // Compressed size
    lv.setUint32(22, data.length, true); // Uncompressed size
    lv.setUint16(26, nameBytes.length, true); // File name length
    lv.setUint16(28, 0, true);           // Extra field length
    localHeader.set(nameBytes, 30);

    // Central directory entry (46 bytes + name)
    const centralEntry = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralEntry.buffer);
    cv.setUint32(0, 0x02014b50, true);  // Central directory signature
    cv.setUint16(4, 20, true);           // Version made by
    cv.setUint16(6, 20, true);           // Version needed to extract
    cv.setUint16(8, 0, true);            // General purpose bit flag
    cv.setUint16(10, 0, true);           // Compression method
    cv.setUint16(12, 0, true);           // Last mod file time
    cv.setUint16(14, 0, true);           // Last mod file date
    cv.setUint32(16, crc, true);         // CRC-32
    cv.setUint32(20, data.length, true); // Compressed size
    cv.setUint32(24, data.length, true); // Uncompressed size
    cv.setUint16(28, nameBytes.length, true); // File name length
    cv.setUint16(30, 0, true);           // Extra field length
    cv.setUint16(32, 0, true);           // File comment length
    cv.setUint16(34, 0, true);           // Disk number start
    cv.setUint16(36, 0, true);           // Internal file attributes
    cv.setUint32(38, 0, true);           // External file attributes
    cv.setUint32(42, localOffset, true); // Relative offset of local header
    centralEntry.set(nameBytes, 46);

    parts.push(localHeader);
    parts.push(data);
    centralParts.push(centralEntry);
    localOffset += localHeader.length + data.length;
  }

  // End of central directory record (22 bytes)
  const centralDirOffset = localOffset;
  let centralDirSize = 0;
  for (const c of centralParts) centralDirSize += c.length;

  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);        // End of central dir signature
  ev.setUint16(4, 0, true);                  // Disk number
  ev.setUint16(6, 0, true);                  // Disk with central dir
  ev.setUint16(8, entries.length, true);      // Entries on this disk
  ev.setUint16(10, entries.length, true);     // Total entries
  ev.setUint32(12, centralDirSize, true);     // Size of central directory
  ev.setUint32(16, centralDirOffset, true);   // Offset of central directory
  ev.setUint16(20, 0, true);                  // Comment length

  const totalSize = localOffset + centralDirSize + 22;
  const result = new Uint8Array(totalSize);
  let pos = 0;
  for (const p of parts) { result.set(p, pos); pos += p.length; }
  for (const c of centralParts) { result.set(c, pos); pos += c.length; }
  result.set(eocd, pos);

  return result;
}

/**
 * CRC-32 computation for ZIP file entries.
 */
function crc32(data: Uint8Array): number {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }

  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// ============================================
// Utilities
// ============================================

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Convert 1-based column index to Excel column letter (1=A, 26=Z, 27=AA) */
function colLetter(colNum: number): string {
  let result = '';
  let n = colNum;
  while (n > 0) {
    n--;
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26);
  }
  return result;
}

/**
 * customXml/item1.xml wraps the DataMashup binary as base64.
 */
function buildCustomXmlItem(base64DataMashup: string): string {
  return `<?xml version="1.0" encoding="utf-8" standalone="yes"?>
<DataMashup xmlns="http://schemas.microsoft.com/DataMashup">${base64DataMashup}</DataMashup>`;
}

/**
 * customXml/itemProps1.xml describes the custom XML part.
 */
function buildCustomXmlItemProps(): string {
  return `<?xml version="1.0" encoding="utf-8" standalone="yes"?>
<ds:datastoreItem ds:itemID="{3F3FE47A-A603-4E81-9B82-21F87C130F01}" xmlns:ds="http://schemas.openxmlformats.org/officeDocument/2006/customXml">
  <ds:schemaRefs>
    <ds:schemaRef ds:uri="http://schemas.microsoft.com/DataMashup" />
  </ds:schemaRefs>
</ds:datastoreItem>`;
}
