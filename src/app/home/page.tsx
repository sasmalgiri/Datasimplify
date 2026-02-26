'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { AuthGate } from '@/components/AuthGate';
import { usePersonaStore } from '@/lib/persona/personaStore';
import { getPersonaDefinition } from '@/lib/persona/helpers';
import { PERSONA_DEFINITIONS } from '@/lib/persona/definitions';
import { PersonaPicker } from '@/components/persona/PersonaPicker';
import { PersonaOnboardingTour } from '@/components/persona/PersonaOnboardingTour';
import { FreeNavbar } from '@/components/FreeNavbar';
import { LIVE_DASHBOARDS } from '@/lib/live-dashboard/definitions';
import { REPORT_KITS } from '@/lib/reportKits';
import {
  TrendingUp,
  CandlestickChart,
  Layers,
  FlaskConical,
  Briefcase,
  Building2,
  Video,
  Loader2,
  ChevronRight,
  Star,
  ArrowRight,
  ExternalLink,
  Settings,
} from 'lucide-react';
import type { PersonaId } from '@/lib/persona/types';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  TrendingUp,
  CandlestickChart,
  Layers,
  FlaskConical,
  Briefcase,
  Video,
  Building2,
};

const TOOL_NAMES: Record<string, { name: string; icon: string }> = {
  '/compare': { name: 'Coin Compare', icon: '⚖️' },
  '/trending': { name: 'Trending Coins', icon: '🔥' },
  '/heatmap': { name: 'Market Heatmap', icon: '🗺️' },
  '/screener': { name: 'Coin Screener', icon: '🔍' },
  '/charts': { name: 'Chart Library', icon: '📈' },
  '/technical': { name: 'Technical Analysis', icon: '📐' },
  '/correlation': { name: 'Correlation Matrix', icon: '🔗' },
  '/risk': { name: 'Risk Analysis', icon: '🛡️' },
  '/defi': { name: 'DeFi Analytics', icon: '🏦' },
  '/dex-pools': { name: 'DEX Pools', icon: '💧' },
  '/etf': { name: 'Crypto ETFs', icon: '📊' },
};

export default function HomePage() {
  const { user, profile, isLoading: authLoading } = useAuth();

  const persona = usePersonaStore((s) => s.persona);
  const onboardingCompleted = usePersonaStore((s) => s.onboardingCompleted);
  const setPersona = usePersonaStore((s) => s.setPersona);
  const setOnboardingCompleted = usePersonaStore(
    (s) => s.setOnboardingCompleted,
  );
  const syncToSupabase = usePersonaStore((s) => s.syncToSupabase);
  const loadFromSupabase = usePersonaStore((s) => s.loadFromSupabase);

  // Hydrate persona from Supabase on mount (if profile has it but store doesn't)
  useEffect(() => {
    if (user && !persona && profile?.preferences?.persona) {
      setPersona(profile.preferences.persona as PersonaId);
      if (profile.preferences.onboardingCompleted) {
        setOnboardingCompleted(true);
      }
    } else if (user && !persona) {
      loadFromSupabase();
    }
  }, [user, persona, profile, setPersona, setOnboardingCompleted, loadFromSupabase]);

  // Auth gate — shows "Sign in required" message if not logged in
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }
  if (!user) {
    return <AuthGate redirectPath="/home" featureName="your personalized Home"><></></AuthGate>;
  }

  const personaDef = getPersonaDefinition(persona);

  // Handle persona selection on this page (for users who skipped during signup or OAuth)
  const handlePersonaSelect = async (id: PersonaId) => {
    setPersona(id);
    await syncToSupabase();
  };

  // No persona set — show picker
  if (!personaDef) {
    return (
      <div className="min-h-screen bg-gray-50">
        <FreeNavbar />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome to CryptoReportKit!
            </h1>
            <p className="text-gray-500 mt-2">
              Tell us how you use crypto so we can personalize your experience
            </p>
          </div>
          <PersonaPicker selected={persona} onSelect={handlePersonaSelect} />
        </div>
      </div>
    );
  }

  const PersonaIcon = ICON_MAP[personaDef.icon];

  // Get persona-specific data
  const primaryDashboards = personaDef.primaryDashboards
    .map((slug) => LIVE_DASHBOARDS.find((d) => d.slug === slug))
    .filter(Boolean)
    .slice(0, 6);

  const primaryTemplates = personaDef.primaryTemplates
    .map((slug) => REPORT_KITS.find((k) => k.slug === slug))
    .filter(Boolean);

  const primaryTools = personaDef.primaryTools
    .map((path) => ({ path, ...(TOOL_NAMES[path] || { name: path, icon: '🔧' }) }))
    .slice(0, 4);

  // Greeting based on time of day
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="min-h-screen bg-gray-50">
      <FreeNavbar />

      {/* Onboarding Tour */}
      {!onboardingCompleted && (
        <PersonaOnboardingTour
          persona={personaDef}
          onComplete={() => {
            setOnboardingCompleted(true);
            syncToSupabase();
          }}
        />
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            {PersonaIcon && (
              <div className={`w-10 h-10 rounded-xl bg-${personaDef.color}-100 flex items-center justify-center`}>
                <PersonaIcon className={`w-5 h-5 text-${personaDef.color}-600`} />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {greeting}, {profile?.email?.split('@')[0] || 'there'}!
              </h1>
              <p className="text-sm text-gray-500">
                {personaDef.name} — {personaDef.tagline}
              </p>
            </div>
          </div>
          <Link
            href="/account#persona"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:border-gray-300 transition"
          >
            <Settings className="w-3.5 h-3.5" />
            Change
          </Link>
        </div>

        {/* Quick Actions */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {personaDef.quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-sm transition group"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition">
                  <ChevronRight className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {action.label}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {action.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Your Dashboards */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
              Your Dashboards
            </h2>
            <Link
              href="/live-dashboards"
              className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              See all 83 <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {primaryDashboards.map((d) =>
              d ? (
                <Link
                  key={d.slug}
                  href={`/live-dashboards/${d.slug}`}
                  className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-sm transition group"
                >
                  <span className="text-xl">{d.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {d.name}
                      </p>
                      <Star className="w-3 h-3 text-amber-400 flex-shrink-0" />
                      {d.tier === 'pro' && (
                        <span className="text-[9px] px-1 py-0.5 rounded bg-amber-100 text-amber-600 font-medium flex-shrink-0">
                          PRO
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                      {d.description}
                    </p>
                  </div>
                </Link>
              ) : null,
            )}
          </div>
        </section>

        {/* Recommended Templates */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
              Recommended Templates
            </h2>
            <Link
              href="/downloads"
              className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              All templates <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {primaryTemplates.map((t) =>
              t ? (
                <Link
                  key={t.slug}
                  href={`/templates/${t.slug}`}
                  className="p-4 bg-white rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-sm transition"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{t.icon}</span>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {t.name}
                      </p>
                      {t.tier === 'pro' && (
                        <span className="text-[9px] px-1 py-0.5 rounded bg-amber-100 text-amber-600 font-medium flex-shrink-0">
                          PRO
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {t.tagline}
                  </p>
                </Link>
              ) : null,
            )}
          </div>
        </section>

        {/* Your Tools */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
              Your Tools
            </h2>
            <Link
              href="/tools"
              className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              All tools <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {primaryTools.map((tool) => (
              <Link
                key={tool.path}
                href={tool.path}
                className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-sm transition"
              >
                <span className="text-lg">{tool.icon}</span>
                <p className="text-sm font-medium text-gray-900">{tool.name}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Suggested Workflow */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Suggested Workflow
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {personaDef.suggestedWorkflow.map((step) => (
              <Link
                key={step.step}
                href={step.href}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 transition group"
              >
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {step.step}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 transition flex-shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
