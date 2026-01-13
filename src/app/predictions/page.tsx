'use client';

import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';

export default function PredictionsPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-6">📊</div>
        <h1 className="text-3xl font-bold mb-4">Page Not Available</h1>
        <p className="text-gray-400 mb-8">
          This feature is not available. DataSimplify provides software analytics tools
          and Excel templates for educational data visualization.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/templates"
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium transition-colors"
          >
            Browse Templates
          </Link>
          <Link
            href="/market"
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
          >
            View Market Data
          </Link>
        </div>
      </div>
    </div>
  );
}
