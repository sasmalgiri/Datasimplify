'use client';

import Link from 'next/link';
import { Clock, Mail, ArrowLeft, Bell } from 'lucide-react';
import { useState } from 'react';

interface ComingSoonProps {
  featureName: string;
  featureDescription?: string;
  expectedLaunch?: string;
}

export function ComingSoon({
  featureName,
  featureDescription,
  expectedLaunch,
}: ComingSoonProps) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real implementation, this would send to an API
    setSubmitted(true);
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-6">
          <Clock className="w-8 h-8" />
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Coming Soon</h1>
        <h2 className="text-xl font-semibold text-emerald-600 mb-4">{featureName}</h2>

        {/* Description */}
        {featureDescription && (
          <p className="text-gray-600 mb-6">{featureDescription}</p>
        )}

        {/* Expected Launch */}
        {expectedLaunch && (
          <p className="text-sm text-gray-500 mb-8">
            Expected: <span className="font-medium">{expectedLaunch}</span>
          </p>
        )}

        {/* Email Signup */}
        {!submitted ? (
          <form onSubmit={handleSubmit} className="mb-8">
            <p className="text-sm text-gray-600 mb-3">
              Get notified when this feature launches:
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  required
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
              >
                <Bell className="w-4 h-4" />
                Notify Me
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-8">
            <p className="text-emerald-800 font-medium">
              Thanks! We&apos;ll notify you when {featureName} launches.
            </p>
          </div>
        )}

        {/* Links to available features */}
        <div className="border-t border-gray-200 pt-6">
          <p className="text-sm text-gray-500 mb-4">
            In the meantime, check out what&apos;s available:
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/templates"
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              Report Kits
            </Link>
            <Link
              href="/market"
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              Market Data
            </Link>
            <Link
              href="/learn"
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              Learn Crypto
            </Link>
          </div>
        </div>

        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mt-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
