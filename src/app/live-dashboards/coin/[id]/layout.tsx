import type { Metadata } from 'next';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const name = id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

  return {
    title: `${name} Dashboard — Live Coin Analytics`,
    description: `Live analytics dashboard for ${name}. Track price, volume, market cap, and key on-chain metrics in real time.`,
    alternates: { canonical: `${siteUrl}/live-dashboards/coin/${id}` },
    openGraph: {
      title: `${name} Coin Dashboard | CryptoReportKit`,
      description: `Live analytics for ${name}.`,
      url: `${siteUrl}/live-dashboards/coin/${id}`,
    },
  };
}

export default function CoinDashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
