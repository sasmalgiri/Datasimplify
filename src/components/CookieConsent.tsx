'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Cookie consent banner for GDPR/CCPA compliance
export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  // Start with server-safe defaults — read localStorage in useEffect to avoid hydration mismatch
  const [preferences, setPreferences] = useState({ necessary: true, analytics: false, marketing: false });

  useEffect(() => {
    // Read saved preferences from localStorage
    const consent = window.localStorage.getItem('cookie-consent');
    if (consent) {
      try {
        setPreferences(JSON.parse(consent) as { necessary: boolean; analytics: boolean; marketing: boolean });
      } catch {
        // keep defaults
      }
    }

    // Show banner only if no consent exists; delay to avoid layout shift.
    if (!consent) {
      const timeout = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timeout);
    }

    // Make showCookieSettings function globally available
    (window as any).showCookieSettings = () => {
      setShowPreferences(true);
      setShowBanner(true);
    };
  }, []);

  const broadcastConsentChange = () => {
    window.dispatchEvent(new Event('cookie-consent-changed'));
  };

  const acceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
    };
    localStorage.setItem('cookie-consent', JSON.stringify(allAccepted));
    setPreferences(allAccepted);
    setShowBanner(false);
    setShowPreferences(false);
    broadcastConsentChange();
  };

  const acceptNecessary = () => {
    const necessaryOnly = {
      necessary: true,
      analytics: false,
      marketing: false,
    };
    localStorage.setItem('cookie-consent', JSON.stringify(necessaryOnly));
    setPreferences(necessaryOnly);
    setShowBanner(false);
    setShowPreferences(false);
    broadcastConsentChange();
  };

  const savePreferences = () => {
    localStorage.setItem('cookie-consent', JSON.stringify(preferences));
    setShowBanner(false);
    setShowPreferences(false);
    broadcastConsentChange();
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Main Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gray-900 border-t border-gray-700 shadow-lg">
        <div className="max-w-6xl mx-auto">
          {!showPreferences ? (
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">We value your privacy</h3>
                <p className="text-gray-300 text-sm">
                  We use cookies to enhance your browsing experience, analyze site traffic, and personalize content.
                  By clicking &quot;Accept All&quot;, you consent to our use of cookies.{' '}
                  <Link href="/privacy" className="text-blue-400 hover:text-blue-300 underline">
                    Read our Privacy Policy
                  </Link>
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowPreferences(true)}
                  className="px-4 py-2 text-sm text-gray-300 hover:text-white border border-gray-600 rounded-lg transition"
                >
                  Manage Preferences
                </button>
                <button
                  onClick={acceptNecessary}
                  className="px-4 py-2 text-sm text-gray-300 hover:text-white border border-gray-600 rounded-lg transition"
                >
                  Necessary Only
                </button>
                <button
                  onClick={acceptAll}
                  className="px-6 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  Accept All
                </button>
              </div>
            </div>
          ) : (
            // Cookie Preferences Panel
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Cookie Preferences</h3>
                <button
                  onClick={() => setShowPreferences(false)}
                  className="text-gray-400 hover:text-white"
                  aria-label="Close cookie preferences"
                  title="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Necessary Cookies */}
              <div className="flex items-start justify-between py-3 border-b border-gray-700">
                <div className="flex-1 pr-4">
                  <h4 className="text-white font-medium">Necessary Cookies</h4>
                  <p className="text-gray-400 text-sm mt-1">
                    Required for the website to function. Cannot be disabled.
                  </p>
                </div>
                <div className="flex items-center">
                  <span className="text-green-400 text-sm font-medium">Always Active</span>
                </div>
              </div>

              {/* Analytics Cookies */}
              <div className="flex items-start justify-between py-3 border-b border-gray-700">
                <div className="flex-1 pr-4">
                  <h4 className="text-white font-medium">Analytics Cookies</h4>
                  <p className="text-gray-400 text-sm mt-1">
                    Help us understand how visitors interact with our website (Vercel Analytics).
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                    className="sr-only peer"
                    aria-label="Enable analytics cookies"
                    title="Analytics cookies"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Marketing Cookies */}
              <div className="flex items-start justify-between py-3 border-b border-gray-700">
                <div className="flex-1 pr-4">
                  <h4 className="text-white font-medium">Marketing Cookies</h4>
                  <p className="text-gray-400 text-sm mt-1">
                    Used to deliver personalized advertisements and track campaigns.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                    className="sr-only peer"
                    aria-label="Enable marketing cookies"
                    title="Marketing cookies"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={acceptNecessary}
                  className="px-4 py-2 text-sm text-gray-300 hover:text-white border border-gray-600 rounded-lg transition"
                >
                  Reject All
                </button>
                <button
                  onClick={savePreferences}
                  className="px-6 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Utility function to check cookie consent (use in components that need it)
export function getCookieConsent(): { necessary: boolean; analytics: boolean; marketing: boolean } | null {
  if (typeof window === 'undefined') return null;

  const consent = localStorage.getItem('cookie-consent');
  if (!consent) return null;

  try {
    return JSON.parse(consent);
  } catch {
    return null;
  }
}
