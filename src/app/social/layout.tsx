import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: 'Crypto Social Metrics — Community Size & Engagement',
  description:
    'Analyze crypto community metrics: Twitter followers, Reddit subscribers, Telegram members, GitHub activity, and developer engagement across top coins.',
  alternates: { canonical: `${siteUrl}/social` },
  openGraph: {
    title: 'Crypto Social Metrics & Community Data | CryptoReportKit',
    description:
      'Analyze crypto community metrics: Twitter followers, Reddit subscribers, Telegram members, and developer engagement.',
  },
};

export default function SocialLayout({ children }: { children: React.ReactNode }) {
  return children;
}
