import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Dashboard Builder | CryptoReportKit',
  description:
    'Build custom crypto dashboards with AI. Describe what you want to track and let AI generate a personalized dashboard.',
  robots: { index: false, follow: true },
};

export default function AIBuilderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
