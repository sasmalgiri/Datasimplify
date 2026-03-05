import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/supabase/api-auth';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// ── GET: list user's uploads ──
export async function GET(request: NextRequest) {
  const auth = await getAuthUser(request);
  if (!auth.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data, error } = await (supabase.from('datalab_excel_uploads') as any)
    .select('id, filename, sheet_name, columns, row_count, coin, days, preset, is_active, created_at')
    .eq('user_id', auth.user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch uploads' }, { status: 500 });
  }

  return NextResponse.json({ uploads: data || [] });
}

// ── POST: upload and parse Excel file ──
export async function POST(request: NextRequest) {
  const auth = await getAuthUser(request);
  if (!auth.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx') {
      return NextResponse.json({ error: 'Only .xlsx files are accepted' }, { status: 400 });
    }

    // Parse Excel
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const arrayBuf = await file.arrayBuffer();
    await workbook.xlsx.load(arrayBuf as any);

    // ── Validate: must be from CryptoReportKit ──
    if (workbook.creator !== 'CryptoReportKit') {
      return NextResponse.json(
        { error: 'This file was not exported from CryptoReportKit. Only CRK-generated Excel files are accepted.' },
        { status: 400 },
      );
    }

    // ── Try to read _CRK_META sheet for DataLab exports ──
    let coin: string | null = null;
    let days: number | null = null;
    let preset: string | null = null;
    let exportType = 'unknown';
    const columnMapping: Array<{ key: string; source: string; label: string }> = [];

    const metaSheet = workbook.getWorksheet('_CRK_META');
    if (metaSheet) {
      metaSheet.eachRow((row) => {
        const key = String(row.getCell(1).value || '');
        const val = String(row.getCell(2).value || '');
        if (key === 'export_type') exportType = val;
        if (key === 'coin') coin = val || null;
        if (key === 'days') days = parseInt(val) || null;
        if (key === 'preset') preset = val || null;
        // Column mapping rows have 6 cells: id, source, label, chartType, yAxis, color
        if (key && key !== '--- columns ---' && !['crk_version', 'export_type', 'coin', 'days', 'preset', 'exported_at', 'column_count', 'row_count'].includes(key)) {
          const source = val;
          const label = String(row.getCell(3).value || key);
          if (source) {
            columnMapping.push({ key, source, label });
          }
        }
      });
    }

    // ── Find the data sheet ──
    // Priority: "DataLab" sheet (from our export), then first sheet with "Market Data", then first sheet
    let dataSheet = workbook.getWorksheet('DataLab')
      || workbook.getWorksheet('Market Data')
      || workbook.worksheets.find((ws) => ws.name !== '_CRK_META' && ws.state !== 'veryHidden');

    if (!dataSheet) {
      return NextResponse.json({ error: 'No valid data sheet found' }, { status: 400 });
    }

    // ── Parse sheet data ──
    const headers: string[] = [];
    const rows: Record<string, string | number | null>[] = [];

    const headerRow = dataSheet.getRow(1);
    headerRow.eachCell((cell, colNumber) => {
      headers[colNumber - 1] = String(cell.value || `Column ${colNumber}`);
    });

    if (headers.length < 2) {
      return NextResponse.json({ error: 'File must have at least 2 columns (Date + data)' }, { status: 400 });
    }

    // Parse data rows (skip header)
    const maxRows = 1000;
    let rowCount = 0;
    dataSheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1 || rowCount >= maxRows) return;

      const rowData: Record<string, string | number | null> = {};
      let hasData = false;

      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1];
        if (!header) return;

        let value = cell.value;
        // Handle ExcelJS cell types
        if (value && typeof value === 'object' && 'result' in value) {
          value = (value as any).result; // formula result
        }
        if (value instanceof Date) {
          value = value.toISOString().split('T')[0];
        }

        if (value != null && value !== '') {
          hasData = true;
          rowData[header] = typeof value === 'number' ? value : String(value);
        } else {
          rowData[header] = null;
        }
      });

      // Skip the disclaimer footer row
      const firstVal = String(rowData[headers[0]] || '');
      if (firstVal.includes('cryptoreportkit.com') || firstVal.includes('For personal use')) return;

      if (hasData) {
        rows.push(rowData);
        rowCount++;
      }
    });

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No data rows found in the file' }, { status: 400 });
    }

    // Build columns metadata
    const columns = headers.map((h, i) => {
      const mapped = columnMapping.find((m) => m.label === h);
      return {
        key: h,
        label: h,
        source: mapped?.source || (i === 0 ? 'date' : 'custom'),
      };
    });

    // ── Store in Supabase ──
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Deactivate previous uploads for this user (keep only latest active)
    await (supabase.from('datalab_excel_uploads') as any)
      .update({ is_active: false })
      .eq('user_id', auth.user.id)
      .eq('is_active', true);

    const { data: inserted, error } = await (supabase.from('datalab_excel_uploads') as any)
      .insert({
        user_id: auth.user.id,
        filename: file.name,
        sheet_name: dataSheet.name,
        columns,
        data: rows,
        row_count: rows.length,
        coin,
        days,
        preset,
      })
      .select('id, filename, sheet_name, columns, row_count, coin, days, preset, created_at')
      .single();

    if (error) {
      console.error('Failed to store upload:', error);
      return NextResponse.json({ error: 'Failed to store upload' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      upload: inserted,
      preview: {
        headers,
        rowCount: rows.length,
        sampleRows: rows.slice(0, 5),
      },
    });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Failed to process file' }, { status: 500 });
  }
}

// ── DELETE: remove an upload ──
export async function DELETE(request: NextRequest) {
  const auth = await getAuthUser(request);
  if (!auth.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing upload id' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  await (supabase.from('datalab_excel_uploads') as any)
    .delete()
    .eq('id', id)
    .eq('user_id', auth.user.id);

  return NextResponse.json({ success: true });
}
