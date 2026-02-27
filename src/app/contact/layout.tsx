import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: 'Contact Us — Support & Feedback',
  description:
    'Get in touch with the CryptoReportKit team. Report bugs, request features, ask about Pro plans, or send general feedback. We typically respond within 24-48 hours.',
  alternates: { canonical: `${siteUrl}/contact` },
  openGraph: {
    title: 'Contact CryptoReportKit',
    description:
      'Get in touch with the CryptoReportKit team for support, feedback, or Pro plan questions.',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
