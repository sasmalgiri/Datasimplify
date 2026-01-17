import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Demo - CryptoReportKit',
  robots: {
    index: false,
    follow: false,
  },
};

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
