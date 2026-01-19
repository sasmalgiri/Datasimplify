'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { isFeatureEnabled } from '@/lib/featureFlags';

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const pathname = usePathname();
  const socialEnabled = isFeatureEnabled('socialSentiment');

  const navigation = [
    {
      name: 'Markets',
      href: '/',
      icon: '📊',
      children: [
        { name: 'Market Map', href: '/', icon: '🗺️', desc: 'Visual market overview' },
        { name: 'All Coins', href: '/coins', icon: '🪙', desc: 'Browse all cryptocurrencies' },
        { name: 'Compare', href: '/compare', icon: '⚖️', desc: 'Side-by-side comparison' },
        { name: 'Trending', href: '/trending', icon: '🔥', desc: 'Hot coins right now' },
      ]
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: '📈',
      children: [
        { name: 'Fear & Greed', href: '/sentiment', icon: '😱', desc: 'Market sentiment index' },
        { name: 'ETF Flows', href: '/etf', icon: '📊', desc: 'Bitcoin ETF tracking' },
        { name: 'Correlation', href: '/correlation', icon: '🔗', desc: 'How coins move together' },
        ...(isFeatureEnabled('whales')
          ? [{ name: 'Whale Tracker', href: '/whales', icon: '🐋', desc: 'Big player activity' }]
          : []),
        ...(isFeatureEnabled('risk')
          ? [{ name: 'Risk Analysis', href: '/risk', icon: '⚠️', desc: 'Safety metrics' }]
          : []),
        ...(socialEnabled
          ? [{ name: 'Social Buzz', href: '/social', icon: '📱', desc: 'Social media sentiment' }]
          : []),
      ]
    },
    {
      name: 'Tools',
      href: '/tools',
      icon: '🛠️',
      children: [
        { name: 'Excel Downloads', href: '/templates', icon: '📋', desc: 'Powered by CryptoSheets' },
        { name: 'Technical Indicators', href: '/technical', icon: '📊', desc: 'Educational indicator analysis' },
        { name: 'Portfolio Tracker', href: '/portfolio', icon: '💼', desc: 'Track your holdings' },
      ]
    },
    {
      name: 'Learn',
      href: '/learn',
      icon: '📚',
      children: [
        { name: 'Crypto Academy', href: '/learn', icon: '🎓', desc: 'Free courses' },
        { name: 'Glossary', href: '/glossary', icon: '📖', desc: '100+ terms explained' },
        { name: 'FAQ', href: '/faq', icon: '❓', desc: 'Common questions' },
      ]
    },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            <span className="font-bold text-xl text-gray-900">CryptoReportKit</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navigation.map((item) => (
              <div
                key={item.name}
                className="relative"
                onMouseEnter={() => setOpenDropdown(item.name)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <Link
                  href={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors ${
                    pathname === item.href || item.children?.some(c => pathname === c.href)
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                  {item.children && <span className="text-xs">▼</span>}
                </Link>

                {/* Dropdown */}
                {item.children && openDropdown === item.name && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                    {item.children.map((child) => (
                      <Link
                        key={child.name}
                        href={child.href}
                        className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                          pathname === child.href ? 'bg-blue-50' : ''
                        }`}
                      >
                        <span className="text-xl">{child.icon}</span>
                        <div>
                          <p className="font-medium text-gray-900">{child.name}</p>
                          <p className="text-xs text-gray-500">{child.desc}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right Side */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/pricing"
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Start Free
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-600"
          >
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 py-4 px-4">
          {navigation.map((item) => (
            <div key={item.name} className="mb-4">
              <p className="text-xs font-bold text-gray-400 uppercase mb-2">
                {item.icon} {item.name}
              </p>
              <div className="space-y-1">
                {item.children?.map((child) => (
                  <Link
                    key={child.name}
                    href={child.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block px-3 py-2 rounded-lg ${
                      pathname === child.href 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="mr-2">{child.icon}</span>
                    {child.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
          
          <div className="border-t border-gray-200 pt-4 mt-4 flex flex-col gap-2">
            <Link
              href="/pricing"
              className="block px-3 py-2 text-gray-600"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              💰 Pricing
            </Link>
            <Link
              href="/login"
              className="block px-3 py-2 text-gray-600"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              🔐 Log in
            </Link>
            <Link
              href="/signup"
              className="block px-3 py-2 bg-blue-600 text-white rounded-lg text-center"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Start Free
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
