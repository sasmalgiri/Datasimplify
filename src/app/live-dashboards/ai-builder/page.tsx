'use client';

import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { ArrowLeft } from 'lucide-react';
import AIDashboardBuilder from '@/components/live-dashboard/AIDashboardBuilder';

export default function AIBuilderPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <FreeNavbar />
      <Breadcrumb customTitle="AI Dashboard Builder" />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Link
          href="/live-dashboards/explore"
          className="inline-flex items-center gap-1.5 text-gray-500 hover:text-emerald-400 text-sm mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Explore
        </Link>

        <AIDashboardBuilder />
      </main>
    </div>
  );
}
