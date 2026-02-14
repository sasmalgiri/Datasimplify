import type { NextConfig } from "next";
import path from 'path';

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.coingecko.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'coin-images.coingecko.com',
        pathname: '/**',
      },
    ],
  },
  // Transpile ECharts for Next.js compatibility
  transpilePackages: ['echarts', 'zrender', 'echarts-gl'],

  // Redirects for broken/moved URLs
  async redirects() {
    return [
      // Policy pages - ensure consistent URLs
      {
        source: '/refund-policy',
        destination: '/refund',
        permanent: true,
      },
      {
        source: '/template-setup',
        destination: '/template-requirements',
        permanent: true,
      },
      {
        source: '/setup',
        destination: '/template-requirements',
        permanent: true,
      },
      {
        source: '/requirements',
        destination: '/template-requirements',
        permanent: true,
      },
      // Fix typo routes - redirect to Smart Contract Verifier
      {
        source: '/safecontract',
        destination: '/smart-contract-verifier',
        permanent: true,
      },
      {
        source: '/contract',
        destination: '/smart-contract-verifier',
        permanent: true,
      },
      // Disabled features - redirect to coming soon
      {
        source: '/whales',
        destination: '/coming-soon?feature=whales',
        permanent: false,
      },
      {
        source: '/exchanges',
        destination: '/coming-soon?feature=exchanges',
        permanent: false,
      },
      {
        source: '/nft',
        destination: '/coming-soon?feature=nft',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
