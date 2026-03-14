import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Tauri Auto-Updater Endpoint
 *
 * Returns update information in the Tauri updater JSON format.
 * Target values: windows-x86_64, darwin-x86_64, darwin-aarch64, linux-x86_64
 *
 * When no update is available, returns 204 No Content (Tauri convention).
 *
 * In production, this would check against a database table or GitHub Releases API
 * to return the latest version for the given target platform.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ target: string; current_version: string }> },
) {
  const { target, current_version } = await params;

  // TODO: In production, query a `desktop_releases` table or GitHub Releases API
  // to get the latest version and download URLs for each platform.
  //
  // Example DB query:
  // const latest = await supabaseAdmin
  //   .from('desktop_releases')
  //   .select('*')
  //   .eq('target', target)
  //   .eq('is_latest', true)
  //   .single();
  //
  // For now, return 204 (no update available) since we haven't published v1.0.0 yet.

  const LATEST_VERSION = '1.0.0';

  // If current version matches latest, no update
  if (current_version === LATEST_VERSION) {
    return new NextResponse(null, { status: 204 });
  }

  // When an update IS available, return this format:
  // return NextResponse.json({
  //   version: LATEST_VERSION,
  //   notes: 'Bug fixes and performance improvements',
  //   pub_date: '2026-03-15T00:00:00Z',
  //   platforms: {
  //     'windows-x86_64': {
  //       signature: 'dW50cnVzdGVk...',
  //       url: 'https://github.com/cryptoreportkit/desktop/releases/download/v1.0.1/CryptoReportKit_1.0.1_x64_en-US.msi.zip',
  //     },
  //     'darwin-x86_64': {
  //       signature: 'dW50cnVzdGVk...',
  //       url: 'https://github.com/cryptoreportkit/desktop/releases/download/v1.0.1/CryptoReportKit.app.tar.gz',
  //     },
  //     'darwin-aarch64': {
  //       signature: 'dW50cnVzdGVk...',
  //       url: 'https://github.com/cryptoreportkit/desktop/releases/download/v1.0.1/CryptoReportKit.app.tar.gz',
  //     },
  //     'linux-x86_64': {
  //       signature: 'dW50cnVzdGVk...',
  //       url: 'https://github.com/cryptoreportkit/desktop/releases/download/v1.0.1/CryptoReportKit_1.0.1_amd64.AppImage.tar.gz',
  //     },
  //   },
  // });

  // No update available yet
  return new NextResponse(null, { status: 204 });
}
