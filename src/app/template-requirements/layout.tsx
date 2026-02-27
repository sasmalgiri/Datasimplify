import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: 'Template Requirements — System & Browser',
  description: 'System requirements for CryptoReportKit Excel templates and analytics dashboards. Compatible with Excel 2016+, modern browsers, and all operating systems.',
  alternates: {
    canonical: `${siteUrl}/template-requirements`,
  },
  openGraph: {
    title: 'Template Requirements | CryptoReportKit',
    description: 'System requirements for CryptoReportKit Excel templates and dashboards.',
  },
};

export default function TemplateRequirementsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
