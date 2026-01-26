'use client';

import Link from 'next/link';
import { FileSpreadsheet } from 'lucide-react';
import type { CoinMarketData } from '@/types/crypto';

interface DownloadButtonProps {
  coins: CoinMarketData[];
  filename?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  showDropdown?: boolean;
}

export default function DownloadButton({
  coins,
  filename,
  variant = 'primary',
  size = 'md',
  showDropdown = true,
}: DownloadButtonProps) {
  const baseClasses = 'font-medium rounded-xl transition-all flex items-center gap-2';

  const variantClasses = {
    primary: 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm hover:shadow',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    ghost: 'hover:bg-gray-100 text-gray-600',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  // IMPORTANT: this app ships templates (formulas/workflows),
  // not raw market-data exports. This button is intentionally template-only.
  void coins;
  void filename;
  void showDropdown;

  return (
    <Link
      href="/download"
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}
    >
      <FileSpreadsheet className="w-4 h-4" />
      Get Excel Template
    </Link>
  );
}