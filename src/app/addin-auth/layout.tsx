import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Add-in Authentication | CryptoReportKit',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AddinAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
