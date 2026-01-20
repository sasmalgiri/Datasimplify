'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TEMPLATE_REQUIREMENTS } from '@/lib/templates/templateModes';

interface RequirementsGateProps {
  onConfirm: () => void;
  className?: string;
}

/**
 * RequirementsGate Component
 *
 * Hard gate that users must acknowledge before downloading templates.
 * Ensures they understand the BYOK requirements:
 * - Excel Desktop (not Excel Online)
 * - CRK add-in installed
 * - Own API key connected (BYOK)
 */
export function RequirementsGate({ onConfirm, className = '' }: RequirementsGateProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const allChecked = checkedItems.size === TEMPLATE_REQUIREMENTS.length;

  const toggleItem = (id: string) => {
    setCheckedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div className={`bg-gray-900 rounded-xl border border-yellow-500/50 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Before You Download</h3>
          <p className="text-sm text-gray-400">Please confirm you have the following:</p>
        </div>
      </div>

      {/* Requirements Checklist */}
      <div className="space-y-4 mb-6">
        {TEMPLATE_REQUIREMENTS.map((req) => (
          <label
            key={req.id}
            className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
              checkedItems.has(req.id)
                ? 'bg-emerald-900/20 border-emerald-500/50'
                : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
            }`}
          >
            <div className="flex-shrink-0 pt-0.5">
              <input
                type="checkbox"
                checked={checkedItems.has(req.id)}
                onChange={() => toggleItem(req.id)}
                className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-gray-900"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`font-medium ${checkedItems.has(req.id) ? 'text-emerald-400' : 'text-white'}`}>
                  {req.name}
                </span>
                {checkedItems.has(req.id) && (
                  <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <p className="text-sm text-gray-400 mt-1">{req.description}</p>
              {!checkedItems.has(req.id) && (
                <div className="mt-2 text-xs">
                  <Link
                    href="/template-requirements"
                    className="text-emerald-400 hover:underline"
                  >
                    {req.howToFix}
                  </Link>
                </div>
              )}
            </div>
          </label>
        ))}
      </div>

      {/* Important Notice */}
      <div className="bg-gray-800/50 rounded-lg p-4 mb-6 border border-gray-700">
        <h4 className="font-medium text-white mb-2 flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Important: BYOK Architecture
        </h4>
        <p className="text-sm text-gray-300">
          Templates run on <strong>your own API key</strong> (Bring Your Own Key). Data usage depends on
          your data provider&apos;s plan (e.g., CoinGecko Demo API has 10,000 calls/month).
          Your keys are encrypted and never shared.
        </p>
      </div>

      {/* Action Button */}
      <button
        type="button"
        onClick={onConfirm}
        disabled={!allChecked}
        className={`w-full py-3 px-6 rounded-lg font-medium transition-all ${
          allChecked
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
            : 'bg-gray-700 text-gray-400 cursor-not-allowed'
        }`}
      >
        {allChecked ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            I Have All Requirements - Continue to Templates
          </span>
        ) : (
          <span>Please confirm all requirements above</span>
        )}
      </button>

      {/* Help Link */}
      <p className="text-center text-xs text-gray-500 mt-4">
        Need help?{' '}
        <Link
          href="/template-requirements"
          className="text-emerald-400 hover:underline"
        >
          View detailed setup guide
        </Link>
      </p>
    </div>
  );
}
