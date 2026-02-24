import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Learn Crypto — Courses & Glossary | CryptoReportKit',
  description:
    'Learn cryptocurrency fundamentals with beginner-friendly courses and a comprehensive crypto glossary. From blockchain basics to portfolio management.',
  openGraph: {
    title: 'Learn Crypto — Courses & Glossary | CryptoReportKit',
    description:
      'Learn cryptocurrency fundamentals with beginner-friendly courses and a comprehensive crypto glossary.',
  },
};

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return children;
}
