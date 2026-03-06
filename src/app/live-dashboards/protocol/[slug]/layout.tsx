import type { Metadata } from 'next';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const name = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

  return {
    title: `${name} Protocol Dashboard — Live DeFi Analytics`,
    description: `Live analytics dashboard for the ${name} protocol. Track TVL, volume, fees, and key metrics in real time.`,
    alternates: { canonical: `${siteUrl}/live-dashboards/protocol/${slug}` },
    openGraph: {
      title: `${name} Protocol | CryptoReportKit`,
      description: `Live analytics for the ${name} protocol.`,
      url: `${siteUrl}/live-dashboards/protocol/${slug}`,
    },
  };
}

export default function ProtocolSlugLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
