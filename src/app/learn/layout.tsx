import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: 'Learn Crypto — Courses & Glossary | CryptoReportKit',
  description:
    'Learn cryptocurrency fundamentals with beginner-friendly courses and a comprehensive crypto glossary. From blockchain basics to portfolio management.',
  alternates: { canonical: `${siteUrl}/learn` },
  openGraph: {
    title: 'Learn Crypto — Courses & Glossary | CryptoReportKit',
    description:
      'Learn cryptocurrency fundamentals with beginner-friendly courses and a comprehensive crypto glossary.',
  },
};

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return children;
}
