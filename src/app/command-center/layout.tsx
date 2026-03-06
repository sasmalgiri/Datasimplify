import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: 'Command Center | CryptoReportKit',
  description:
    'Your crypto workspace command center. Choose a workspace, refresh data, and generate client-ready report packs in two clicks.',
  alternates: { canonical: `${siteUrl}/command-center` },
  openGraph: {
    title: 'Command Center | CryptoReportKit',
    description:
      'Your crypto workspace command center. Choose a workspace, refresh data, and generate client-ready report packs in two clicks.',
    url: `${siteUrl}/command-center`,
  },
};

export default function CommandCenterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
