import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: 'Smart Contract Verifier - Sourcify & Security Analysis',
  description: 'Verify smart contract source code on Ethereum, Polygon, BSC & more chains. Check Sourcify verification status, analyze security with Z3 formal verification. Free tool.',
  keywords: [
    'smart contract verifier',
    'sourcify verification',
    'contract source code verification',
    'ethereum contract verify',
    'solidity code verification',
    'blockchain contract checker',
    'smart contract security',
    'contract audit tool',
    'verify contract address',
    'z3 formal verification'
  ],
  openGraph: {
    title: 'Smart Contract Verifier | CryptoReportKit',
    description: 'Verify smart contract source code on Ethereum, Polygon, BSC & more. Check Sourcify status & security analysis with Z3.',
    url: `${siteUrl}/smart-contract-verifier`,
    type: 'website',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'CryptoReportKit Smart Contract Verifier',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Smart Contract Verifier | CryptoReportKit',
    description: 'Verify smart contracts on Ethereum, Polygon, BSC. Sourcify + Z3 security analysis. Free.',
    images: [`${siteUrl}/og-image.png`],
  },
  alternates: {
    canonical: `${siteUrl}/smart-contract-verifier`,
  },
};

export default function SmartContractVerifierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
