'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { FlaskConical, Search, ArrowRight } from 'lucide-react';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import {
  getSortedCategories,
  getTemplatesGroupedByCategory,
  type TemplateCategoryId,
} from '@/lib/templates/templateConfig';
import { TEMPLATE_LAYOUT_MAP, LAYOUT_META } from '@/lib/templates/experimentLayouts';

export default function TemplatesHubPage() {
  const [activeCategory, setActiveCategory] = useState<TemplateCategoryId | 'all'>('all');
  const [search, setSearch] = useState('');

  const categories = useMemo(() => getSortedCategories(), []);
  const grouped = useMemo(() => getTemplatesGroupedByCategory(), []);

  const filteredGroups = useMemo(() => {
    const q = search.toLowerCase().trim();
    return grouped
      .filter((g) => activeCategory === 'all' || g.category.id === activeCategory)
      .map((g) => ({
        ...g,
        templates: g.templates.filter(
          (t) =>
            !q ||
            t.name.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            t.id.toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.templates.length > 0);
  }, [grouped, activeCategory, search]);

  return (
    <>
      <FreeNavbar />
      <main className="min-h-screen bg-[#0a0a0f] pt-20 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Breadcrumb customTitle="Experiment Lab" />

          {/* Header */}
          <div className="mt-6 mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-emerald-400/10">
                <FlaskConical className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Experiment Lab</h1>
                <p className="text-sm text-gray-400">
                  Choose a template, explore live data, then download in any format
                </p>
              </div>
            </div>
          </div>

          {/* Filters bar */}
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            {/* Category tabs */}
            <div className="flex items-center gap-1 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                  activeCategory === 'all'
                    ? 'bg-emerald-400/15 text-emerald-400 border-emerald-400/30'
                    : 'bg-white/[0.03] text-gray-400 border-white/[0.06] hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                    activeCategory === cat.id
                      ? 'bg-emerald-400/15 text-emerald-400 border-emerald-400/30'
                      : 'bg-white/[0.03] text-gray-400 border-white/[0.06] hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  <span className="mr-1">{cat.icon}</span>
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative ml-auto">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search templates..."
                className="w-48 bg-white/[0.04] border border-white/[0.1] text-white text-xs pl-8 pr-3 py-2 rounded-lg focus:outline-none focus:border-emerald-400/40 placeholder:text-gray-600"
              />
            </div>
          </div>

          {/* Template grid by category */}
          {filteredGroups.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-sm">No templates match your search</p>
            </div>
          ) : (
            <div className="space-y-10">
              {filteredGroups.map((group) => (
                <section key={group.category.id}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg">{group.category.icon}</span>
                    <h2 className="text-lg font-semibold text-white">{group.category.name}</h2>
                    <span className="text-xs text-gray-500 ml-1">({group.templates.length})</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {group.templates.map((t) => {
                      const layout = TEMPLATE_LAYOUT_MAP[group.category.id];
                      const layoutMeta = LAYOUT_META[layout];
                      return (
                        <Link
                          key={t.id}
                          href={`/templates/${t.id}/experiment`}
                          className="group relative bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.04] hover:border-emerald-400/20 transition"
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-2xl flex-shrink-0">{t.icon}</span>
                            <div className="min-w-0">
                              <h3 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition truncate">
                                {t.name}
                              </h3>
                              <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">
                                {t.description}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/[0.04]">
                            <span className="text-[10px] text-gray-600">{layoutMeta.title}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-emerald-400 transition" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
