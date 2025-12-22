'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronDown,
  BarChart3,
  TrendingUp,
  Download,
  Brain,
  BookOpen,
  Wallet,
  Menu,
  X,
  LineChart,
  Scale,
  FileSpreadsheet,
  MessageSquare,
  GraduationCap,
  HelpCircle,
  Shield,
  Activity,
  Zap,
  Bell,
  DollarSign,
  Sparkles,
  Users,
  Trophy,
} from 'lucide-react';

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
        <div className="absolute top-full left-0 mt-1 w-72 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden z-50">
          <div className="p-2">
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
    data: {
      label: 'Data',
      icon: <BarChart3 className="w-4 h-4" />,
      paths: ['/market', '/charts', '/compare', '/download'],
      items: [
        { href: '/market', label: 'Market Overview', description: 'Live prices, rankings & trends', icon: <TrendingUp className="w-4 h-4" /> },
        { href: '/charts', label: 'Charts & Analysis', description: 'Technical charts & indicators', icon: <LineChart className="w-4 h-4" /> },
        { href: '/compare', label: 'Compare Coins', description: 'Side-by-side comparison', icon: <Scale className="w-4 h-4" /> },
        { href: '/download', label: 'Download Center', description: 'Export data to Excel/CSV', icon: <FileSpreadsheet className="w-4 h-4" /> },
      ],
    },
    analysis: {
      label: 'Analysis',
      icon: <Brain className="w-4 h-4" />,
      paths: ['/monitor', '/predictions', '/dashboard', '/portfolio'],
      items: [
        { href: '/monitor', label: 'AI Monitor', description: 'Real-time market predictions', icon: <Brain className="w-4 h-4" /> },
        { href: '/predictions', label: 'AI Prediction Center', description: 'Bulk predictions for 75+ coins', icon: <Sparkles className="w-4 h-4" /> },
        { href: '/dashboard', label: 'Dashboard', description: 'Your personalized overview', icon: <Activity className="w-4 h-4" /> },
        { href: '/portfolio', label: 'Portfolio Builder', description: 'Build & track portfolios', icon: <Wallet className="w-4 h-4" /> },
      ],
    },
    tools: {
      label: 'Tools',
      icon: <Zap className="w-4 h-4" />,
      paths: ['/chat', '/alerts'],
      items: [
        { href: '/chat', label: 'AI Chat', description: 'Ask questions about crypto', icon: <MessageSquare className="w-4 h-4" /> },
        { href: '/alerts', label: 'Price Alerts', description: 'Get notified on price moves', icon: <Bell className="w-4 h-4" /> },
      ],
    },
    community: {
      label: 'Community',
      icon: <Users className="w-4 h-4" />,
      paths: ['/community'],
      items: [
        { href: '/community', label: 'Prediction Forum', description: 'Share & discuss predictions', icon: <Users className="w-4 h-4" /> },
        { href: '/community?tab=leaderboard', label: 'Leaderboard', description: 'Top predictors ranking', icon: <Trophy className="w-4 h-4" /> },
      ],
    },
    learn: {
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
    { href: '/market', label: 'Market', icon: <TrendingUp className="w-4 h-4" /> },
    { href: '/charts', label: 'Charts', icon: <LineChart className="w-4 h-4" /> },
    { href: '/compare', label: 'Compare', icon: <Scale className="w-4 h-4" /> },
    { href: '/download', label: 'Download', icon: <Download className="w-4 h-4" /> },
    { href: '/monitor', label: 'AI Monitor', icon: <Brain className="w-4 h-4" /> },
    { href: '/predictions', label: 'Predictions', icon: <Sparkles className="w-4 h-4" /> },
    { href: '/community', label: 'Community', icon: <Users className="w-4 h-4" /> },
    { href: '/dashboard', label: 'Dashboard', icon: <Activity className="w-4 h-4" /> },
    { href: '/chat', label: 'AI Chat', icon: <MessageSquare className="w-4 h-4" /> },
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
            {Object.entries(navSections).map(([key, section]) => (
              <NavDropdown
                key={key}
                label={section.label}
                icon={section.icon}
                items={section.items}
                isActive={isInSection(section.paths)}
              />
            ))}
            {/* Prominent AI Predictions link */}
            <Link
              href="/predictions"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition ${
                isActive('/predictions')
                  ? 'text-purple-400 bg-purple-500/10'
                  : 'text-purple-300 hover:text-purple-200 hover:bg-purple-700/30 border border-purple-500/30'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              AI Predictions
            </Link>
            <Link
              href="/pricing"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition ${
                isActive('/pricing')
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              Pricing
            </Link>
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-gray-300 hover:text-white transition"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-emerald-500 rounded-lg hover:bg-emerald-600 transition font-medium"
            >
              Sign Up Free
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
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2 text-center bg-emerald-500 rounded-lg hover:bg-emerald-600 transition font-medium"
              >
                Sign Up Free
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
