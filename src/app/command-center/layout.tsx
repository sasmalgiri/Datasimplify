import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Command Center | CryptoReportKit',
  description:
    'Your crypto workspace command center. Choose a workspace, refresh data, and generate client-ready report packs in two clicks.',
};

export default function CommandCenterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
