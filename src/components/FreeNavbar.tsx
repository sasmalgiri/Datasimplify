'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronDown,
  BarChart3,
  BookOpen,
  Download,
  Menu,
  X,
  Scale,
  FileSpreadsheet,
  GraduationCap,
  HelpCircle,
  Shield,
  LayoutDashboard,
  FlaskConical,
} from 'lucide-react';

import { isFeatureEnabled, FEATURES } from '@/lib/featureFlags';
import { useAuth } from '@/lib/auth';
import { usePersonaStore } from '@/lib/persona/personaStore';
import { getPersonaDefinition } from '@/lib/persona/helpers';
import { Star } from 'lucide-react';

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
  const { user } = useAuth();
  const persona = usePersonaStore((s) => s.persona);
  const personaDef = getPersonaDefinition(persona);

  const isActive = (path: string) => pathname === path;
  const isInSection = (paths: string[]) => paths.some(p => pathname.startsWith(p));

  // Focused navigation: Only A/B/C features
  // A) Reports/Downloads - Excel template packs
  // B) Compare - Coin comparison with market cap calculator
  // C) Verify - Smart contract verification (Sourcify + Z3)
  const navSections = {
    reports: {
      label: 'Templates',
      icon: <FileSpreadsheet className="w-4 h-4" />,
      paths: ['/templates', '/download', '/downloads', '/template-requirements', '/byok', '/live-dashboards'],
      items: [
        { href: '/live-dashboards', label: 'Live Dashboards', description: 'Interactive web dashboards with your API key', icon: <BarChart3 className="w-4 h-4" /> },
        ...(user ? [
          { href: '/downloads', label: 'Downloads', description: 'Excel templates with prefetched crypto data', icon: <Download className="w-4 h-4" /> },
          { href: '/download', label: 'Customize Templates', description: 'Customize coins/timeframe and download .xlsx', icon: <FileSpreadsheet className="w-4 h-4" /> },
        ] : []),
        { href: '/template-requirements', label: 'Setup Guide', description: 'How to use Excel templates', icon: <HelpCircle className="w-4 h-4" /> },
        { href: '/byok', label: 'BYOK Explained', description: 'Your API key stays in Excel', icon: <Shield className="w-4 h-4" /> },
      ],
    },
    compare: {
      label: 'Tools',
      icon: <Scale className="w-4 h-4" />,
      paths: ['/compare', '/datalab'],
      items: [
        { href: '/compare', label: 'Coin Comparison', description: 'Compare 2-5 coins side-by-side', icon: <Scale className="w-4 h-4" /> },
        { href: '/datalab', label: 'DataLab', description: 'Interactive overlays, edit data & experiment', icon: <FlaskConical className="w-4 h-4" /> },
      ],
    },
    verify: {
      label: 'Verify',
      icon: <Shield className="w-4 h-4" />,
      paths: ['/smart-contract-verifier', '/tools/verify'],
      items: [
        ...(isFeatureEnabled('smartContractVerifier')
          ? [
              {
                href: '/smart-contract-verifier',
                label: 'Contract Verification',
                description: 'Check Sourcify verification status',
                icon: <Shield className="w-4 h-4" />,
              },
            ]
          : []),
      ],
    },
    more: {
      label: 'Learn',
      icon: <BookOpen className="w-4 h-4" />,
      paths: ['/learn', '/glossary', '/faq', '/data-sources'],
      items: [
        { href: '/learn', label: 'Academy', description: 'Crypto education & guides', icon: <GraduationCap className="w-4 h-4" /> },
        { href: '/glossary', label: 'Glossary', description: 'Crypto terms explained', icon: <BookOpen className="w-4 h-4" /> },
        { href: '/faq', label: 'FAQ', description: 'Common questions answered', icon: <HelpCircle className="w-4 h-4" /> },
        { href: '/data-sources', label: 'Data Sources', description: 'CoinGecko attribution & info', icon: <BarChart3 className="w-4 h-4" /> },
      ],
    },
  };

  // Mobile links - focused on A/B/C features only
  const mobileLinks = [
    ...(user
      ? [{ href: '/home', label: 'Home', icon: <Star className="w-4 h-4" /> }]
      : []),
    ...(FEATURES.addinV2 && user
      ? [{ href: '/command-center', label: 'Command Center', icon: <LayoutDashboard className="w-4 h-4" /> }]
      : []),
    { href: '/live-dashboards', label: 'Live Dashboards', icon: <BarChart3 className="w-4 h-4" /> },
    ...(user ? [
      { href: '/datalab', label: 'DataLab', icon: <FlaskConical className="w-4 h-4" /> },
      { href: '/downloads', label: 'Templates', icon: <Download className="w-4 h-4" /> },
      { href: '/download', label: 'Customize', icon: <FileSpreadsheet className="w-4 h-4" /> },
    ] : []),
    { href: '/compare', label: 'Compare Coins', icon: <Scale className="w-4 h-4" /> },
    ...(isFeatureEnabled('smartContractVerifier')
      ? [{ href: '/smart-contract-verifier', label: 'Verify Contract', icon: <Shield className="w-4 h-4" /> }]
      : []),
    { href: '/learn', label: 'Learn', icon: <GraduationCap className="w-4 h-4" /> },
    { href: '/faq', label: 'FAQ', icon: <HelpCircle className="w-4 h-4" /> },
  ];

  return (
    <nav className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            <span className="text-xl font-bold text-emerald-400">CryptoReportKit</span>
          </Link>

          {/* Desktop Nav - Mega Menu */}
          <div className="hidden lg:flex items-center gap-1">
            {FEATURES.addinV2 && user && (
              <Link
                href="/command-center"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition font-medium ${
                  isActive('/command-center')
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Command Center</span>
              </Link>
            )}
            {user && personaDef && (
              <NavDropdown
                label="For You"
                icon={<Star className="w-4 h-4" />}
                items={personaDef.quickActions.map((a) => ({
                  href: a.href,
                  label: a.label,
                  description: a.description,
                  icon: <Star className="w-4 h-4" />,
                }))}
                isActive={false}
              />
            )}
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
            {user ? (
              <Link
                href="/account"
                className="px-4 py-2 text-emerald-400 hover:text-emerald-300 transition font-medium"
              >
                My Account
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 text-gray-300 hover:text-white transition"
              >
                Login
              </Link>
            )}
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
            <div className="flex gap-2 items-center">
              {user ? (
                <Link
                  href="/account"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-2 text-center text-emerald-400 border border-emerald-600 rounded-lg hover:bg-emerald-700/20 transition font-medium"
                >
                  My Account
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-2 text-center text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-700/50 transition"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
