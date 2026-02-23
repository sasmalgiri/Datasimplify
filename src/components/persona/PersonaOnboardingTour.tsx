'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X, ChevronRight, ChevronLeft, Rocket } from 'lucide-react';
import type { PersonaDefinition } from '@/lib/persona/types';
import { LIVE_DASHBOARDS } from '@/lib/live-dashboard/definitions';

interface PersonaOnboardingTourProps {
  persona: PersonaDefinition;
  onComplete: () => void;
}

export function PersonaOnboardingTour({
  persona,
  onComplete,
}: PersonaOnboardingTourProps) {
  const [step, setStep] = useState(0);

  const topDashboards = persona.primaryDashboards
    .slice(0, 3)
    .map((slug) => LIVE_DASHBOARDS.find((d) => d.slug === slug))
    .filter(Boolean);

  const slides = [
    // Slide 0: Welcome
    {
      title: `Welcome, ${persona.name}!`,
      content: (
        <div className="text-center">
          <div className="text-5xl mb-4">🎉</div>
          <p className="text-gray-600 text-sm max-w-md mx-auto">
            {persona.description}
          </p>
          <p className="text-gray-400 text-xs mt-3">
            We&apos;ve personalized your experience based on your profile.
          </p>
        </div>
      ),
    },
    // Slide 1: Top dashboards
    {
      title: 'Your Top Dashboards',
      content: (
        <div className="space-y-2">
          <p className="text-gray-500 text-xs text-center mb-3">
            These dashboards are hand-picked for your workflow
          </p>
          {topDashboards.map((d) =>
            d ? (
              <div
                key={d.slug}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <span className="text-xl">{d.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{d.name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {d.description}
                  </p>
                </div>
                {d.tier === 'pro' && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-600 font-medium">
                    PRO
                  </span>
                )}
              </div>
            ) : null,
          )}
        </div>
      ),
    },
    // Slide 2: Quick actions
    {
      title: 'Quick Actions',
      content: (
        <div className="space-y-2">
          <p className="text-gray-500 text-xs text-center mb-3">
            Your most common actions, always one click away
          </p>
          {persona.quickActions.map((action) => (
            <div
              key={action.href}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <ChevronRight className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {action.label}
                </p>
                <p className="text-xs text-gray-500">{action.description}</p>
              </div>
            </div>
          ))}
        </div>
      ),
    },
  ];

  const currentSlide = slides[step];
  const isLast = step === slides.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <h3 className="text-lg font-bold text-gray-900">
            {currentSlide.title}
          </h3>
          <button
            type="button"
            onClick={onComplete}
            className="p-1 text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 min-h-[220px]">{currentSlide.content}</div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 pb-5 pt-2">
          {/* Dots */}
          <div className="flex items-center gap-1.5">
            {slides.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition ${
                  i === step ? 'bg-emerald-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}
            {isLast ? (
              <Link
                href={persona.quickActions[0]?.href || '/live-dashboards'}
                onClick={onComplete}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition"
              >
                <Rocket className="w-4 h-4" />
                Get Started
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
