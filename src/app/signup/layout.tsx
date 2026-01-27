import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up | CryptoReportKit',
  robots: {
    index: false,
    follow: true,
  },
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
