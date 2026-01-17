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
    ];
  },
};

export default nextConfig;
