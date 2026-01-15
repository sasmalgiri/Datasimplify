'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronDown,
  BarChart3,
  TrendingUp,
  BookOpen,
  Menu,
  X,
  LineChart,
  Scale,
  FileSpreadsheet,
  GraduationCap,
  HelpCircle,
  Zap,
  Shield,
} from 'lucide-react';

import { isFeatureEnabled } from '@/lib/featureFlags';

interface NavDropdownProps {
  label: string;
  icon: React.ReactNode;
  items: { href: string; label: string; description: string; icon: React.ReactNode }[];
  isActive: boolean;
}

function NavDropdown({ label, icon, items, isActive }: NavDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition ${
          isActive
            ? 'text-emerald-400 bg-emerald-500/10'
            : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
        }`}
      >
        {icon}
        <span>{label}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 pt-1 w-72 z-50">
          {/* Invisible bridge to prevent dropdown from closing when mouse moves between button and menu */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden">
            {/* Scrollable container with max height for uniform dropdown size */}
            <div className="max-h-[350px] overflow-y-auto dropdown-scroll p-2">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-700/50 transition group"
                >
                  <div className="p-2 rounded-lg bg-gray-700/50 text-emerald-400 group-hover:bg-emerald-500/20">
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">{item.label}</div>
                    <div className="text-gray-400 text-xs">{item.description}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function FreeNavbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;
  const isInSection = (paths: string[]) => paths.some(p => pathname.startsWith(p));

  const navSections = {
    downloads: {
      label: 'Download',
      icon: <FileSpreadsheet className="w-4 h-4" />,
      paths: ['/templates', '/template-requirements'],
      items: [
        { href: '/templates', label: 'Excel Downloads', description: 'Powered by CryptoSheets', icon: <FileSpreadsheet className="w-4 h-4" /> },
        { href: '/template-requirements', label: 'Setup Guide', description: 'Requirements & instructions', icon: <HelpCircle className="w-4 h-4" /> },
      ],
    },
    analytics: {
      label: 'Analytics',
      icon: <TrendingUp className="w-4 h-4" />,
      paths: ['/analyst-hub', '/market', '/trending', '/gainers-losers', '/onchain', '/sentiment', '/technical', '/correlation', ...(isFeatureEnabled('risk') ? ['/risk'] : [])],
      items: [
        { href: '/analyst-hub', label: 'Analyst Hub', description: 'All data in one dashboard', icon: <BarChart3 className="w-4 h-4" /> },
        { href: '/market', label: 'Market Analytics', description: 'Market overview and rankings', icon: <TrendingUp className="w-4 h-4" /> },
        { href: '/trending', label: 'Trending', description: 'Most searched coins', icon: <Zap className="w-4 h-4" /> },
        { href: '/gainers-losers', label: 'Gainers & Losers', description: 'Top market movers', icon: <TrendingUp className="w-4 h-4" /> },
        { href: '/onchain', label: 'On-Chain Analytics', description: 'Network activity and on-chain metrics', icon: <Zap className="w-4 h-4" /> },
        { href: '/sentiment', label: 'Fear & Greed', description: 'Sentiment index and history', icon: <BarChart3 className="w-4 h-4" /> },
        { href: '/technical', label: 'Technical Metrics', description: 'Indicators and levels (educational)', icon: <LineChart className="w-4 h-4" /> },
        { href: '/correlation', label: 'Correlation', description: 'How assets move together', icon: <Scale className="w-4 h-4" /> },
        // Risk metrics hidden in paddle_safe mode (could be perceived as trading advice)
        ...(isFeatureEnabled('risk') ? [{ href: '/risk', label: 'Risk Metrics', description: 'Risk stats and explanations', icon: <Shield className="w-4 h-4" /> }] : []),
      ],
    },
    discover: {
      label: 'Discover',
      icon: <Zap className="w-4 h-4" />,
      paths: ['/recently-added', '/nft', '/exchanges', '/categories', '/global-market', '/dex-pools'],
      items: [
        { href: '/recently-added', label: 'New Listings', description: 'Recently added coins', icon: <Zap className="w-4 h-4" /> },
        { href: '/dex-pools', label: 'DEX Pools', description: 'Trending liquidity pools', icon: <TrendingUp className="w-4 h-4" /> },
        { href: '/nft', label: 'NFT Collections', description: 'Top NFTs by market cap', icon: <Zap className="w-4 h-4" /> },
        { href: '/exchanges', label: 'Exchanges', description: 'Exchange rankings', icon: <BarChart3 className="w-4 h-4" /> },
        { href: '/categories', label: 'Categories', description: 'Browse by category', icon: <LineChart className="w-4 h-4" /> },
        { href: '/global-market', label: 'Global Market', description: 'Market cap history', icon: <TrendingUp className="w-4 h-4" /> },
      ],
    },
    research: {
      label: 'Research',
      icon: <LineChart className="w-4 h-4" />,
      paths: ['/research', '/charts', '/compare'],
      items: [
        { href: '/research', label: 'Research Workspace', description: 'Watchlists, quick links, research flow', icon: <LineChart className="w-4 h-4" /> },
        { href: '/charts', label: 'Charts', description: 'Explore charts and export snapshots', icon: <LineChart className="w-4 h-4" /> },
        { href: '/compare', label: 'Comparisons', description: 'Compare coins side-by-side', icon: <Scale className="w-4 h-4" /> },
      ],
    },
    tools: {
      label: 'Tools',
      icon: <Zap className="w-4 h-4" />,
      paths: ['/smart-contract-verifier', '/tools'],
      items: [
        ...(isFeatureEnabled('smartContractVerifier')
          ? [
              {
                href: '/smart-contract-verifier',
                label: 'Smart Contract Verification',
                description: 'Check verification status (not a security audit)',
                icon: <Shield className="w-4 h-4" />,
              },
            ]
          : []),
      ],
    },
    more: {
      label: 'Learn',
      icon: <BookOpen className="w-4 h-4" />,
      paths: ['/learn', '/glossary', '/faq'],
      items: [
        { href: '/learn', label: 'Academy', description: 'Crypto education & guides', icon: <GraduationCap className="w-4 h-4" /> },
        { href: '/glossary', label: 'Glossary', description: 'Crypto terms explained', icon: <BookOpen className="w-4 h-4" /> },
        { href: '/faq', label: 'FAQ', description: 'Common questions answered', icon: <HelpCircle className="w-4 h-4" /> },
      ],
    },
  };

  const mobileLinks = [
    { href: '/analyst-hub', label: 'Analyst Hub', icon: <BarChart3 className="w-4 h-4" /> },
    { href: '/templates', label: 'Download', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { href: '/market', label: 'Market', icon: <TrendingUp className="w-4 h-4" /> },
    { href: '/trending', label: 'Trending', icon: <Zap className="w-4 h-4" /> },
    { href: '/onchain', label: 'On-Chain', icon: <Zap className="w-4 h-4" /> },
    { href: '/charts', label: 'Charts', icon: <LineChart className="w-4 h-4" /> },
    { href: '/compare', label: 'Compare', icon: <Scale className="w-4 h-4" /> },
    { href: '/research', label: 'Research', icon: <LineChart className="w-4 h-4" /> },
    ...(isFeatureEnabled('smartContractVerifier')
      ? [{ href: '/smart-contract-verifier', label: 'Contract Verification', icon: <Shield className="w-4 h-4" /> }]
      : []),
    { href: '/learn', label: 'Learn', icon: <GraduationCap className="w-4 h-4" /> },
  ];

  return (
    <nav className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            <span className="text-xl font-bold text-emerald-400">DataSimplify</span>
          </Link>

          {/* Desktop Nav - Mega Menu */}
          <div className="hidden lg:flex items-center gap-1">
            {Object.entries(navSections)
              .filter(([, section]) => section.items.length > 0)
              .map(([key, section]) => (
              <NavDropdown
                key={key}
                label={section.label}
                icon={section.icon}
                items={section.items}
                isActive={isInSection(section.paths)}
              />
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-gray-300 hover:text-white transition"
            >
              Login
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-gray-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-gray-700 pt-4">
            <div className="grid grid-cols-2 gap-2 mb-4">
              {mobileLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 p-3 rounded-lg transition ${
                    isActive(link.href)
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-gray-700/30 text-gray-300 hover:bg-gray-700/50'
                  }`}
                >
                  {link.icon}
                  <span className="text-sm font-medium">{link.label}</span>
                </Link>
              ))}
            </div>
            <div className="flex gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2 text-center text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-700/50 transition"
              >
                Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
