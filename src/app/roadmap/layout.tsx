import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: 'Roadmap — Upcoming Features & Development',
  description:
    'See what is coming next to CryptoReportKit: planned features, upcoming tools, and development milestones. Follow our journey from 83 dashboards to 200+.',
  alternates: { canonical: `${siteUrl}/roadmap` },
  openGraph: {
    title: 'CryptoReportKit Roadmap',
    description:
      'See what is coming next: planned features, upcoming tools, and development milestones.',
    url: `${siteUrl}/roadmap`,
  },
};

export default function RoadmapLayout({ children }: { children: React.ReactNode }) {
  return children;
}
