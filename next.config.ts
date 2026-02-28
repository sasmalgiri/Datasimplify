import type { NextConfig } from "next";
import path from 'path';

const nextConfig: NextConfig = {
  // Normalise URLs so /market and /market/ aren't treated as two pages
  trailingSlash: false,
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

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },

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
      // Dead wizard page - backend API removed
      {
        source: '/wizard',
        destination: '/templates',
        permanent: true,
      },
      // Old download center → templates hub
      {
        source: '/download',
        destination: '/templates',
        permanent: true,
      },
      // Old downloads portal → templates hub
      {
        source: '/downloads',
        destination: '/templates',
        permanent: true,
      },
      // Old template gallery → templates hub
      {
        source: '/templates/gallery',
        destination: '/templates',
        permanent: true,
      },
      // Old excel-templates → templates hub
      {
        source: '/excel-templates/:slug',
        destination: '/templates',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
