'use client';

export interface ExportOptions {
  scale?: number;
  watermark?: boolean;
}

/**
 * Convert modern CSS color functions (oklch, oklab) that html2canvas can't parse
 * into standard rgb() values. Uses a hidden DOM probe to let the browser resolve them.
 */
function sanitizeCssColors(css: string): string {
  if (!/oklch|oklab/i.test(css)) return css;

  const cache = new Map<string, string>();
  const probe = document.createElement('div');
  probe.style.display = 'none';
  document.body.appendChild(probe);

  const convert = (match: string): string => {
    const cached = cache.get(match);
    if (cached) return cached;
    try {
      probe.style.color = '';
      probe.style.color = match;
      const computed = getComputedStyle(probe).color;
      const result = computed && computed !== '' ? computed : match;
      cache.set(match, result);
      return result;
    } catch {
      cache.set(match, 'rgb(136,136,136)');
      return 'rgb(136,136,136)';
    }
  };

  const result = css
    .replace(/oklch\([^)]+\)/gi, convert)
    .replace(/oklab\([^)]+\)/gi, convert);

  document.body.removeChild(probe);
  return result;
}

/**
 * Pre-fetch linked stylesheets that contain oklch/oklab and prepare fixed versions.
 * Must be done async before the synchronous onclone callback.
 */
async function prepareStylesheetFixes(): Promise<Map<string, string>> {
  const fixes = new Map<string, string>();
  const links = document.querySelectorAll('link[rel="stylesheet"]');

  await Promise.all(
    Array.from(links).map(async (link) => {
      const href = link.getAttribute('href');
      if (!href) return;
      try {
        const resp = await fetch(href);
        const css = await resp.text();
        if (/oklch|oklab/i.test(css)) {
          fixes.set(href, sanitizeCssColors(css));
        }
      } catch {
        // Ignore CORS-blocked or unavailable stylesheets
      }
    }),
  );

  return fixes;
}

/**
 * Apply CSS fixes inside html2canvas onclone callback.
 * Replaces oklch/oklab in both inline <style> and linked <link> stylesheets.
 */
function applyStyleFixes(clonedDoc: Document, linkFixes: Map<string, string>) {
  // Fix inline <style> elements
  clonedDoc.querySelectorAll('style').forEach((style) => {
    if (style.textContent && /oklch|oklab/i.test(style.textContent)) {
      style.textContent = sanitizeCssColors(style.textContent);
    }
  });

  // Replace linked stylesheets with fixed inline versions
  clonedDoc.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    const href = link.getAttribute('href');
    if (href && linkFixes.has(href)) {
      const inlineStyle = clonedDoc.createElement('style');
      inlineStyle.textContent = linkFixes.get(href)!;
      link.replaceWith(inlineStyle);
    }
  });
}

function applyWatermark(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;

  // Diagonal tiled text
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px sans-serif';
  ctx.rotate(-Math.PI / 6); // -30 degrees

  for (let y = -h; y < h * 2; y += 300) {
    for (let x = -w; x < w * 2; x += 400) {
      ctx.fillText('CryptoReportKit', x, y);
    }
  }
  ctx.restore();

  // Bottom-right badge
  ctx.save();
  ctx.globalAlpha = 0.15;
  const badgeText = 'CryptoReportKit Free';
  ctx.font = 'bold 24px sans-serif';
  const metrics = ctx.measureText(badgeText);
  const bw = metrics.width + 32;
  const bh = 40;
  const bx = w - bw - 20;
  const by = h - bh - 20;

  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, 8);
  ctx.fill();

  ctx.fillStyle = '#10b981';
  ctx.fillText(badgeText, bx + 16, by + 28);
  ctx.restore();
}

export async function exportDashboardAsPdf(dashboardName: string, options?: ExportOptions) {
  const element = document.getElementById('dashboard-content');
  if (!element) throw new Error('Dashboard content not found. Please ensure the dashboard has loaded.');

  try {
    // Pre-fetch and fix stylesheets with modern color functions
    const linkFixes = await prepareStylesheetFixes();

    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');

    const canvas = await html2canvas(element, {
      backgroundColor: '#0a0a0f',
      scale: options?.scale ?? 2,
      useCORS: true,
      logging: false,
      onclone: (clonedDoc) => applyStyleFixes(clonedDoc, linkFixes),
    });

    if (options?.watermark) applyWatermark(canvas);

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    const pdf = new jsPDF({
      orientation: imgWidth > imgHeight ? 'landscape' : 'portrait',
      unit: 'px',
      format: [imgWidth + 80, imgHeight + 140],
    });

    const pageWidth = pdf.internal.pageSize.getWidth();

    // Header
    pdf.setFillColor(10, 10, 15);
    pdf.rect(0, 0, pageWidth, imgHeight + 140, 'F');

    pdf.setFontSize(18);
    pdf.setTextColor(255, 255, 255);
    pdf.text(dashboardName, 40, 40);

    pdf.setFontSize(10);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`Generated ${new Date().toLocaleDateString()} — CryptoReportKit`, 40, 58);

    // Dashboard image
    pdf.addImage(imgData, 'PNG', 40, 75, imgWidth, imgHeight);

    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text(
      'For personal use only — Data sourced from CoinGecko via your API key — cryptoreportkit.com',
      40,
      imgHeight + 110,
    );

    pdf.save(`${dashboardName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (err: any) {
    throw new Error(`PDF export failed: ${err.message || 'Unknown error'}`);
  }
}

export async function exportDashboardAsPng(dashboardName: string, options?: ExportOptions) {
  const element = document.getElementById('dashboard-content');
  if (!element) throw new Error('Dashboard content not found. Please ensure the dashboard has loaded.');

  try {
    // Pre-fetch and fix stylesheets with modern color functions
    const linkFixes = await prepareStylesheetFixes();

    const html2canvas = (await import('html2canvas')).default;

    const canvas = await html2canvas(element, {
      backgroundColor: '#0a0a0f',
      scale: options?.scale ?? 2,
      useCORS: true,
      logging: false,
      onclone: (clonedDoc) => applyStyleFixes(clonedDoc, linkFixes),
    });

    if (options?.watermark) applyWatermark(canvas);

    const link = document.createElement('a');
    link.download = `${dashboardName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (err: any) {
    throw new Error(`PNG export failed: ${err.message || 'Unknown error'}`);
  }
}
