'use client';

export async function exportDashboardAsPdf(dashboardName: string) {
  const element = document.getElementById('dashboard-content');
  if (!element) throw new Error('Dashboard content not found. Please ensure the dashboard has loaded.');

  try {
    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');

    const canvas = await html2canvas(element, {
      backgroundColor: '#0a0a0f',
      scale: 2,
      useCORS: true,
      logging: false,
    });

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

export async function exportDashboardAsPng(dashboardName: string) {
  const element = document.getElementById('dashboard-content');
  if (!element) throw new Error('Dashboard content not found. Please ensure the dashboard has loaded.');

  try {
    const html2canvas = (await import('html2canvas')).default;

    const canvas = await html2canvas(element, {
      backgroundColor: '#0a0a0f',
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const link = document.createElement('a');
    link.download = `${dashboardName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (err: any) {
    throw new Error(`PNG export failed: ${err.message || 'Unknown error'}`);
  }
}
