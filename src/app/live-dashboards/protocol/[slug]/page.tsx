'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { DashboardShell } from '@/components/live-dashboard/DashboardShell';
import { ArrowLeft, Zap } from 'lucide-react';
import { getSiteThemeClasses } from '@/lib/live-dashboard/theme';
import type { LiveDashboardDefinition } from '@/lib/live-dashboard/definitions';

// ── Helpers ─────────────────────────────────────────────────────────────

/** Convert a DeFi Llama slug to a human-readable name.
 *  'aave' -> 'Aave', 'uniswap-v3' -> 'Uniswap V3', 'pancakeswap-amm' -> 'Pancakeswap Amm'
 */
function prettifySlug(slug: string): string {
  return slug
    .split('-')
    .map((word) => {
      // Keep version strings like "v2", "v3" uppercase
      if (/^v\d+$/i.test(word)) return word.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/** Build a full LiveDashboardDefinition for any protocol slug. */
function buildProtocolDefinition(slug: string): LiveDashboardDefinition {
  const prettyName = prettifySlug(slug);

  return {
    slug: `protocol-${slug}`,
    name: `${prettyName} Analytics`,
    description: `${prettyName} protocol deep dive — TVL history, chain breakdown, fees & revenue, DEX volumes, and protocol rankings. Powered by DeFi Llama (free, no API key required).`,
    icon: '\uD83D\uDD2C', // microscope emoji
    tier: 'free',
    gridColumns: 4,
    requiredEndpoints: [
      'defillama_protocol_tvl',
      'defillama_fees_overview',
      'defillama_dex_overview',
      'defillama_protocols',
    ],
    widgets: [
      {
        id: 'protocol-info',
        component: 'ProtocolInfoWidget',
        title: `${prettyName} Overview`,
        gridColumn: '1 / -1',
        dataEndpoints: ['defillama_protocol_tvl'],
        props: { protocolSlug: slug },
        mobileOrder: 1,
      },
      {
        id: 'tvl-history',
        component: 'ProtocolTVLHistoryWidget',
        title: 'TVL History (90d)',
        gridColumn: 'span 2',
        dataEndpoints: ['defillama_protocol_tvl'],
        props: { protocolSlug: slug },
        mobileOrder: 2,
      },
      {
        id: 'chain-breakdown',
        component: 'ProtocolChainBreakdownWidget',
        title: 'TVL by Chain',
        gridColumn: 'span 2',
        dataEndpoints: ['defillama_protocol_tvl'],
        props: { protocolSlug: slug },
        mobileOrder: 3,
      },
      {
        id: 'protocol-fees',
        component: 'ProtocolFeesWidget',
        title: 'Protocol Fees & Revenue',
        gridColumn: '1 / -1',
        dataEndpoints: ['defillama_fees_overview'],
        props: { protocolSlug: slug },
        mobileOrder: 4,
      },
      {
        id: 'dex-volumes',
        component: 'DexVolumeOverviewWidget',
        title: 'DEX Volume Rankings',
        gridColumn: '1 / -1',
        dataEndpoints: ['defillama_dex_overview'],
        props: { protocolSlug: slug },
        mobileOrder: 5,
      },
      {
        id: 'top-protocols-compare',
        component: 'TopProtocolsCompareWidget',
        title: 'Compare with Top Protocols',
        gridColumn: 'span 2',
        dataEndpoints: ['defillama_protocols'],
        props: { protocolSlug: slug },
        mobileOrder: 6,
      },
      {
        id: 'tvl-ranking',
        component: 'DefiTVLRankingWidget',
        title: 'DeFi TVL Rankings',
        gridColumn: 'span 2',
        dataEndpoints: ['defillama_protocols'],
        props: { protocolSlug: slug },
        mobileOrder: 7,
      },
    ],
  };
}

// ── Page Component ──────────────────────────────────────────────────────

export default function ProtocolDashboardPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { fetchData, siteTheme } = useLiveDashboardStore();
  const st = getSiteThemeClasses(siteTheme);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Build the dashboard definition dynamically from the URL slug
  const definition = useMemo<LiveDashboardDefinition>(
    () => buildProtocolDefinition(slug),
    [slug],
  );

  const prettyName = useMemo(() => prettifySlug(slug), [slug]);

  const loadData = useCallback(() => {
    if (!definition) return;
    fetchData(definition.requiredEndpoints, { protocolSlug: slug });
    setInitialLoaded(true);
  }, [definition, slug, fetchData]);

  // Auto-load immediately — all endpoints are key-free (DeFi Llama)
  useEffect(() => {
    if (!initialLoaded) {
      loadData();
    }
  }, [initialLoaded, loadData]);

  // Reset loaded state when slug changes so we re-fetch for the new protocol
  useEffect(() => {
    setInitialLoaded(false);
  }, [slug]);

  return (
    <div className={`min-h-screen ${st.pageBg}`} data-dashboard-theme={siteTheme}>
      <FreeNavbar />
      <Breadcrumb customTitle={`${prettyName} Analytics`} />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Back link */}
        <Link
          href="/live-dashboards/explore"
          className={`inline-flex items-center gap-1.5 ${st.linkText} text-sm mb-6 transition`}
        >
          <ArrowLeft className="w-4 h-4" />
          Explore Protocols
        </Link>

        {/* Free Data badge */}
        <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-xs">
          <Zap className="w-3.5 h-3.5" />
          <span>
            <strong className="font-semibold">Free Data</strong> — This dashboard uses DeFi Llama.
            No API key required. Works for 4,000+ protocols.
          </span>
        </div>

        {/* Dashboard grid */}
        <DashboardShell
          definition={definition}
          onOpenKeyModal={() => {
            /* no-op: key-free dashboard */
          }}
        />
      </main>
    </div>
  );
}
