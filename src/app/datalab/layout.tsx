import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DataLab | CryptoReportKit',
  description: 'Interactive chart overlays, data manipulation, and research experiments for crypto analysis.',
};

export default function DataLabLayout({ children }: { children: React.ReactNode }) {
  return children;
}
