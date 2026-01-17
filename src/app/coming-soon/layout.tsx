import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Coming Soon - CryptoReportKit',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ComingSoonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
