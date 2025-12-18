'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function FreeNavbar() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const navLinks = [
    { href: '/market', label: 'Market' },
    { href: '/compare', label: 'Compare' },
    { href: '/chat', label: 'AI Chat' },
    { href: '/glossary', label: 'Glossary' },
    { href: '/learn', label: 'Learn' },
    { href: '/pricing', label: 'Pricing' },
  ];

  return (
    <nav className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            <span className="text-xl font-bold text-emerald-400">DataSimplify</span>
          </Link>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`transition ${
                  isActive(link.href)
                    ? 'text-emerald-400 font-medium'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="px-4 py-2 bg-emerald-500 rounded-lg hover:bg-emerald-600 transition font-medium"
            >
              Login
            </Link>
          </div>

          {/* Mobile Nav Toggle */}
          <div className="md:hidden">
            <Link
              href="/login"
              className="px-4 py-2 bg-emerald-500 rounded-lg hover:bg-emerald-600 transition text-sm"
            >
              Login
            </Link>
          </div>
        </div>

        {/* Mobile Nav Links */}
        <div className="md:hidden flex gap-4 mt-3 overflow-x-auto pb-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap text-sm transition ${
                isActive(link.href)
                  ? 'text-emerald-400 font-medium'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
