import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { Providers } from '@/components/Providers';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'DataSimplify - Crypto Data Made Simple',
  description: 'Download crypto market data in Excel/CSV format. No coding required. AI-powered analysis.',
  keywords: ['crypto', 'cryptocurrency', 'bitcoin', 'ethereum', 'market data', 'excel', 'csv', 'download'],
};

function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">DS</span>
              </div>
              <span className="font-bold text-xl text-white">
                DataSimplify
              </span>
            </div>
            <p className="text-sm">
              Democratizing financial data for everyone. No coding required.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-white transition-colors">Market Data</Link></li>
              <li><Link href="/download" className="hover:text-white transition-colors">Download Center</Link></li>
              <li><Link href="/compare" className="hover:text-white transition-colors">Compare</Link></li>
              <li><Link href="/chat" className="hover:text-white transition-colors">AI Chat</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-white mb-4">Data Sources</h4>
            <ul className="space-y-2 text-sm">
              <li><span className="text-gray-500">Binance API</span></li>
              <li><span className="text-gray-500">CoinGecko API</span></li>
              <li><span className="text-gray-500">DefiLlama API</span></li>
              <li><span className="text-gray-500">Reddit API</span></li>
              <li><span className="text-gray-500">CryptoPanic API</span></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Refund Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
          <p>© {new Date().getFullYear()} DataSimplify. All rights reserved.</p>
          <p className="mt-2">
            Made with ❤️ | Powered by Ollama AI (FREE) + Supabase (FREE)
          </p>
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
      <body>
        <Providers>
          <Navbar />
          <main className="min-h-screen">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
