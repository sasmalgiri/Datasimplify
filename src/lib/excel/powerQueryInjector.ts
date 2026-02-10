/**
 * Power Query Injector
 *
 * Post-processes an ExcelJS-generated xlsx buffer to inject real Power Query
 * connections. After injection, Excel recognizes the queries as native data
 * connections — users just paste their API key and hit Refresh All.
 *
 * xlsx files are ZIP archives. Power Query connections require:
 * - customXml/item1.xml         → DataMashup binary (base64-wrapped)
 * - customXml/itemProps1.xml    → Properties for the custom XML part
 * - xl/connections.xml          → Connection definitions
 * - [Content_Types].xml         → Updated with new part types
 * - xl/_rels/workbook.xml.rels  → Relationship to connections.xml
 * - _rels/.rels                 → Relationship to customXml
 *
 * BYOK: All M code calls CoinGecko directly with user's API key.
 * Server never touches CoinGecko data.
 */

import JSZip from 'jszip';

export interface PowerQueryDefinition {
  name: string;
  code: string;
  description: string;
}

/**
 * Main entry point: injects Power Query connections into an xlsx buffer.
 * Returns the modified buffer. Falls back to original on error.
 */
export async function injectPowerQueries(
  xlsxBuffer: Buffer,
  queries: PowerQueryDefinition[]
): Promise<Buffer> {
  if (!queries || queries.length === 0) return xlsxBuffer;

  try {
    const zip = await JSZip.loadAsync(xlsxBuffer);

    // 1. Build and inject DataMashup
    const dataMashup = buildDataMashup(queries);
    const dataMashupBase64 = Buffer.from(dataMashup).toString('base64');
    zip.file('customXml/item1.xml', buildCustomXmlItem(dataMashupBase64));
    zip.file('customXml/itemProps1.xml', buildCustomXmlItemProps());

    // 2. Build and inject connections.xml
    zip.file('xl/connections.xml', buildConnectionsXml(queries));

    // 3. Update [Content_Types].xml
    await updateContentTypes(zip);

    // 4. Update xl/_rels/workbook.xml.rels
    await updateWorkbookRels(zip, queries);

    // 5. Update _rels/.rels
    await updateRootRels(zip);

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
function buildDataMashup(queries: PowerQueryDefinition[]): Uint8Array {
  // Build inner package ZIP synchronously-ish using JSZip
  // We'll build it as a buffer
  const packageZip = buildPackageZip(queries);

  // Permissions XML - grants access to CoinGecko and alternative.me
  const permissionsXml = buildPermissionsXml();
  const permissionsBytes = new TextEncoder().encode(permissionsXml);

  // Metadata XML
  const metadataXml = buildMetadataXml(queries);
  const metadataBytes = new TextEncoder().encode(metadataXml);

  // Calculate total size
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
 * - Config/Package.xml (query declarations)
 * - Formulas/Section1.m/<QueryName> (M code per query)
 *
 * Uses a minimal ZIP builder since this needs to be synchronous.
 */
function buildPackageZip(queries: PowerQueryDefinition[]): Uint8Array {
  // Build the Package.xml
  const packageXml = buildPackageXml(queries);

  // Build Section1.m content (all queries in one section file)
  const sectionM = buildSectionM(queries);

  // OPC [Content_Types].xml - required for the inner package to be valid
  const contentTypesXml = `<?xml version="1.0" encoding="utf-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="xml" ContentType="text/xml" />
  <Default Extension="m" ContentType="application/x-ms-m" />
</Types>`;

  // We need a synchronous ZIP. Build a minimal one manually.
  return createMinimalZip({
    '[Content_Types].xml': new TextEncoder().encode(contentTypesXml),
    'Config/Package.xml': new TextEncoder().encode(packageXml),
    'Formulas/Section1.m': new TextEncoder().encode(sectionM),
  });
}

/**
 * Package.xml declares each query in the DataMashup package.
 */
function buildPackageXml(queries: PowerQueryDefinition[]): string {
  const items = queries.map((q, i) => `    <Item>
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
        <Entry Type="FillObjectType" Value="sConnectionOnly" />
        <Entry Type="FillTarget" Value="s${q.name}" />
        <Entry Type="Name" Value="s${q.name}" />
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
 * Each query is a shared expression.
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
  const items = queries.map(q =>
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

  // Concatenate all parts
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
  // Build CRC table
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
// XML Part Builders
// ============================================

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

/**
 * xl/connections.xml defines one connection per Power Query.
 * type="5" = OleDb (used for Power Query connections)
 */
function buildConnectionsXml(queries: PowerQueryDefinition[]): string {
  const connections = queries.map((q, i) => {
    const connId = i + 1;
    return `  <connection id="${connId}" keepAlive="1" name="Query - ${q.name}" description="${escapeXml(q.description)}" type="5" refreshedVersion="0" background="1">
    <dbPr connection="Provider=Microsoft.Mashup.OleDb.1;Data Source=$Workbook$;Location=${q.name};Extended Properties=&quot;&quot;" command="SELECT * FROM [${q.name}]" />
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
 * Updates [Content_Types].xml to include custom XML and connections parts.
 */
async function updateContentTypes(zip: JSZip): Promise<void> {
  const ctFile = zip.file('[Content_Types].xml');
  if (!ctFile) return;

  let xml = await ctFile.async('text');

  // Add overrides if not already present
  const overrides = [
    '<Override PartName="/customXml/item1.xml" ContentType="application/xml" />',
    '<Override PartName="/customXml/itemProps1.xml" ContentType="application/vnd.openxmlformats-officedocument.customXmlProperties+xml" />',
    '<Override PartName="/xl/connections.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.connections+xml" />',
  ];

  for (const override of overrides) {
    if (!xml.includes(override)) {
      xml = xml.replace('</Types>', `  ${override}\n</Types>`);
    }
  }

  zip.file('[Content_Types].xml', xml);
}

/**
 * Updates xl/_rels/workbook.xml.rels to reference connections.xml.
 */
async function updateWorkbookRels(zip: JSZip, queries: PowerQueryDefinition[]): Promise<void> {
  const relsFile = zip.file('xl/_rels/workbook.xml.rels');
  if (!relsFile) return;

  let xml = await relsFile.async('text');

  // Find the highest existing rId
  const rIdMatches = xml.match(/rId(\d+)/g) || [];
  let maxId = 0;
  for (const m of rIdMatches) {
    const num = parseInt(m.replace('rId', ''), 10);
    if (num > maxId) maxId = num;
  }

  // Add connection relationship
  const connRel = `<Relationship Id="rId${maxId + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/connections" Target="connections.xml" />`;

  // Add Power Query data model relationship
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

  // Find highest rId
  const rIdMatches = xml.match(/rId(\d+)/g) || [];
  let maxId = 0;
  for (const m of rIdMatches) {
    const num = parseInt(m.replace('rId', ''), 10);
    if (num > maxId) maxId = num;
  }

  // Add customXml props relationship
  const cxRel = `<Relationship Id="rId${maxId + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/customXml" Target="customXml/item1.xml" />`;

  if (!xml.includes('customXml/item1.xml')) {
    xml = xml.replace('</Relationships>', `  ${cxRel}\n</Relationships>`);
  }

  // Add customXml item props rels
  zip.file('customXml/_rels/item1.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/customXmlProps" Target="itemProps1.xml" />
</Relationships>`);

  zip.file('_rels/.rels', xml);
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
