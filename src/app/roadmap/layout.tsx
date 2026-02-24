import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Roadmap — Upcoming Features & Development',
  description:
    'See what is coming next to CryptoReportKit: planned features, upcoming tools, and development milestones. Follow our journey from 83 dashboards to 200+.',
  openGraph: {
    title: 'CryptoReportKit Roadmap',
    description:
      'See what is coming next: planned features, upcoming tools, and development milestones.',
  },
};

export default function RoadmapLayout({ children }: { children: React.ReactNode }) {
  return children;
}
