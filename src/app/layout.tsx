import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: 'DataSimplify - Crypto Data Made Simple',
  description: 'Download crypto market data in Excel/CSV format. No coding required. AI-powered analysis.',
  keywords: ['crypto', 'cryptocurrency', 'bitcoin', 'ethereum', 'market data', 'excel', 'csv', 'download'],
};

function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">📊</span>
              <span className="font-bold text-xl text-white">DataSimplify</span>
            </div>
            <p className="text-sm">
              Democratizing crypto data for everyone. No coding required.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/market" className="hover:text-white transition-colors">Market Data</Link></li>
              <li><Link href="/compare" className="hover:text-white transition-colors">Compare</Link></li>
              <li><Link href="/chat" className="hover:text-white transition-colors">AI Chat</Link></li>
              <li><Link href="/glossary" className="hover:text-white transition-colors">Glossary</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-white mb-4">Data Sources</h4>
            <ul className="space-y-2 text-sm">
              <li><span className="text-gray-500">CoinGecko API</span></li>
              <li><span className="text-gray-500">Alternative.me (Fear & Greed)</span></li>
              <li><span className="text-gray-500">DeFiLlama API</span></li>
              <li><span className="text-gray-500">CryptoPanic API</span></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
          <p>© {new Date().getFullYear()} DataSimplify. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-900">
        <Providers>
          <main className="min-h-screen">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
