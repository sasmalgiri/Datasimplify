import type { Metadata } from 'next';
import { getDashboardBySlug, LIVE_DASHBOARDS } from '@/lib/live-dashboard/definitions';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const dashboard = getDashboardBySlug(slug);

  if (!dashboard) {
    return {
      title: 'Dashboard Not Found',
      robots: { index: false, follow: false },
    };
  }

  const title = `${dashboard.name} Dashboard — Live Crypto Analytics`;
  const description = dashboard.description || `Live ${dashboard.name} crypto dashboard with real-time data and interactive charts.`;

  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}/live-dashboards/${slug}` },
    openGraph: {
      title: `${dashboard.name} | CryptoReportKit`,
      description,
      url: `${siteUrl}/live-dashboards/${slug}`,
    },
  };
}

export async function generateStaticParams() {
  return LIVE_DASHBOARDS.map((d) => ({ slug: d.slug }));
}

export default function DashboardSlugLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
