'use client';

import { useRouter } from 'next/navigation';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { SITE_THEMES } from '@/lib/live-dashboard/theme';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { TemplateGallery } from '@/components/template-gallery/TemplateGallery';
import { Sparkles } from 'lucide-react';

export default function TemplateGalleryPage() {
  const siteTheme = useLiveDashboardStore((s) => s.siteTheme);
  const st = SITE_THEMES[siteTheme];
  const router = useRouter();

  return (
    <div className={`min-h-screen ${st.pageBg}`}>
      <FreeNavbar />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Breadcrumb customTitle="Template Gallery" />

        <div className="flex items-center gap-3 mt-4 mb-8">
          <Sparkles className="w-6 h-6 text-emerald-400" />
          <div>
            <h1 className={`text-2xl font-bold ${st.textPrimary}`}>Template Gallery</h1>
            <p className={`text-sm ${st.textMuted}`}>
              Report packs and dashboard templates to get started fast
            </p>
          </div>
        </div>

        <TemplateGallery
          onSelectPack={(packId) => router.push(`/command-center`)}
          onSelectDashboard={(slug) => router.push(`/live-dashboards/${slug}`)}
        />
      </div>
    </div>
  );
}
