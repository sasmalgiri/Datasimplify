'use client';

import { useState } from 'react';

export interface OnboardingWizardProps {
  onComplete: () => void;
  onSkip: () => void;
  onSignIn: () => void;
  isSigningIn: boolean;
}

type Step = 'welcome' | 'modes' | 'auth' | 'keys' | 'complete';

export function OnboardingWizard({
  onComplete,
  onSkip,
  onSignIn,
  isSigningIn,
}: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>('welcome');

  const steps: Step[] = ['welcome', 'modes', 'auth', 'keys', 'complete'];
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl max-w-md w-full border border-gray-700">
        {/* Progress Bar */}
        <div className="h-1 bg-gray-700 rounded-t-lg overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-6">
          {currentStep === 'welcome' && <WelcomeStep onNext={handleNext} onSkip={onSkip} />}
          {currentStep === 'modes' && <ModesStep onNext={handleNext} onBack={handleBack} />}
          {currentStep === 'auth' && (
            <AuthStep
              onNext={handleNext}
              onBack={handleBack}
              onSignIn={onSignIn}
              isSigningIn={isSigningIn}
            />
          )}
          {currentStep === 'keys' && <KeysStep onNext={handleNext} onBack={handleBack} />}
          {currentStep === 'complete' && <CompleteStep onComplete={onComplete} />}
        </div>

        {/* Step Indicator */}
        <div className="px-6 pb-4 flex justify-center gap-2">
          {steps.map((step, index) => (
            <div
              key={step}
              className={`w-2 h-2 rounded-full transition-colors ${
                index <= currentStepIndex ? 'bg-emerald-500' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function WelcomeStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  return (
    <div className="text-center">
      <div className="w-20 h-20 mx-auto mb-4 bg-emerald-500/20 rounded-full flex items-center justify-center">
        <span className="text-4xl">📊</span>
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Welcome to CryptoReportKit</h2>
      <p className="text-gray-400 text-sm mb-6">
        Your all-in-one solution for crypto data in Excel. Let's get you set up in less than
        2 minutes.
      </p>

      <div className="space-y-3 mb-6">
        <div className="flex items-start gap-3 p-3 bg-gray-900 rounded-lg">
          <span className="text-emerald-400 text-xl flex-shrink-0">✓</span>
          <div className="text-left">
            <p className="text-sm font-medium text-white">Live Crypto Data</p>
            <p className="text-xs text-gray-500">Real-time prices, OHLCV, and market metrics</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 bg-gray-900 rounded-lg">
          <span className="text-emerald-400 text-xl flex-shrink-0">✓</span>
          <div className="text-left">
            <p className="text-sm font-medium text-white">BYOK Support</p>
            <p className="text-xs text-gray-500">Use your own API keys for higher limits</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 bg-gray-900 rounded-lg">
          <span className="text-emerald-400 text-xl flex-shrink-0">✓</span>
          <div className="text-left">
            <p className="text-sm font-medium text-white">Pre-built Reports</p>
            <p className="text-xs text-gray-500">Download ready-to-use Excel packs</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onSkip}
          className="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium text-gray-300 transition-colors"
        >
          Skip
        </button>
        <button
          onClick={onNext}
          className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium text-white transition-colors"
        >
          Get Started
        </button>
      </div>
    </div>
  );
}

function ModesStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-2">Choose Your Workflow</h2>
      <p className="text-gray-400 text-sm mb-6">
        CRK supports two ways to work with crypto data in Excel:
      </p>

      <div className="space-y-3 mb-6">
        <div className="p-4 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-emerald-400 text-xl">📊</span>
            <h3 className="font-semibold text-white text-sm">Pack Mode</h3>
            <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">
              Recommended
            </span>
          </div>
          <ul className="text-xs text-gray-400 space-y-1 ml-7">
            <li>• Pre-built Excel workbooks</li>
            <li>• One-click refresh for all data</li>
            <li>• Perfect for reports and dashboards</li>
            <li>• No formulas needed</li>
          </ul>
        </div>

        <div className="p-4 bg-gray-700/30 border-2 border-gray-600 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-gray-400 text-xl">📝</span>
            <h3 className="font-semibold text-white text-sm">Formula Mode</h3>
          </div>
          <ul className="text-xs text-gray-400 space-y-1 ml-7">
            <li>• Use =CRK.PRICE(), =CRK.OHLCV() formulas</li>
            <li>• Build custom spreadsheets</li>
            <li>• Full flexibility and control</li>
            <li>• Great for advanced users</li>
          </ul>
        </div>
      </div>

      <div className="p-3 bg-gray-900 rounded-lg mb-6">
        <p className="text-xs text-gray-500">
          💡 <span className="font-medium text-gray-400">Tip:</span> You can use both modes! Download packs from cryptoreportkit.com
          or use formulas in your own sheets.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onBack}
          className="py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium text-gray-300 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium text-white transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function AuthStep({
  onNext,
  onBack,
  onSignIn,
  isSigningIn,
}: {
  onNext: () => void;
  onBack: () => void;
  onSignIn: () => void;
  isSigningIn: boolean;
}) {
  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-2">Sign In</h2>
      <p className="text-gray-400 text-sm mb-6">
        Connect your CryptoReportKit account to access data and manage API keys.
      </p>

      <div className="p-4 bg-gray-900 rounded-lg mb-6">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-emerald-400 text-xl flex-shrink-0">🔒</span>
          <div>
            <p className="text-sm font-medium text-white mb-1">Secure Authentication</p>
            <p className="text-xs text-gray-500">
              We use Office.js Dialog API for secure authentication. Your credentials never
              pass through the add-in.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <span className="text-emerald-400 text-xl flex-shrink-0">🔑</span>
          <div>
            <p className="text-sm font-medium text-white mb-1">Your Data, Your Keys</p>
            <p className="text-xs text-gray-500">
              All API keys are encrypted and stored securely. We never see your plaintext keys.
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={onSignIn}
        disabled={isSigningIn}
        className="w-full py-3 mb-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 rounded-lg font-medium text-white transition-colors"
      >
        {isSigningIn ? 'Opening login...' : 'Sign In with CryptoReportKit'}
      </button>

      <p className="text-xs text-center text-gray-500 mb-6">
        Don&apos;t have an account?{' '}
        <a
          href="https://cryptoreportkit.com/signup"
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-400 hover:underline"
        >
          Create one free
        </a>
      </p>

      <div className="flex gap-2">
        <button
          onClick={onBack}
          className="py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium text-gray-300 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="flex-1 py-2 px-4 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm font-medium text-gray-300 transition-colors"
        >
          Skip for Now
        </button>
      </div>
    </div>
  );
}

function KeysStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-2">Connect API Keys (Optional)</h2>
      <p className="text-gray-400 text-sm mb-6">
        Connect your own API keys to get higher rate limits and premium data access.
      </p>

      <div className="space-y-3 mb-6">
        <div className="p-3 bg-gray-900 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-white">CoinGecko</h3>
            <span className="text-xs text-emerald-400">Recommended</span>
          </div>
          <p className="text-xs text-gray-500 mb-2">
            Get prices, OHLCV, and market data. Free tier: 100 calls/day.
          </p>
          <a
            href="https://www.coingecko.com/en/api/pricing"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-emerald-400 hover:underline"
          >
            Get API key →
          </a>
        </div>

        <div className="p-3 bg-gray-900 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-white">Binance</h3>
            <span className="text-xs text-gray-500">Optional</span>
          </div>
          <p className="text-xs text-gray-500 mb-2">
            Real-time trading data. Public endpoints available without API key.
          </p>
          <a
            href="https://www.binance.com/en/support/faq/how-to-create-api-keys-on-binance-360002502072"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-emerald-400 hover:underline"
          >
            Get API key →
          </a>
        </div>
      </div>

      <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg mb-6">
        <p className="text-xs text-yellow-400">
          💡 You can add API keys later from the main panel. They're completely optional for
          getting started.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onBack}
          className="py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium text-gray-300 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium text-white transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function CompleteStep({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="text-center">
      <div className="w-20 h-20 mx-auto mb-4 bg-emerald-500/20 rounded-full flex items-center justify-center">
        <span className="text-4xl">🎉</span>
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">You're All Set!</h2>
      <p className="text-gray-400 text-sm mb-6">
        Ready to start using CryptoReportKit. Here's what you can do next:
      </p>

      <div className="space-y-3 mb-6 text-left">
        <div className="p-3 bg-gray-900 rounded-lg">
          <p className="text-sm font-medium text-white mb-1">📊 Download a Pack</p>
          <p className="text-xs text-gray-500">
            Visit cryptoreportkit.com/templates to browse pre-built Excel packs
          </p>
        </div>

        <div className="p-3 bg-gray-900 rounded-lg">
          <p className="text-sm font-medium text-white mb-1">📝 Use Formulas</p>
          <p className="text-xs text-gray-500">
            Try =CRK.PRICE("bitcoin") in any cell to get live Bitcoin price
          </p>
        </div>

        <div className="p-3 bg-gray-900 rounded-lg">
          <p className="text-sm font-medium text-white mb-1">🔄 Refresh Data</p>
          <p className="text-xs text-gray-500">
            Click "Refresh All Data" button to update all crypto data
          </p>
        </div>
      </div>

      <button
        onClick={onComplete}
        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium text-white transition-colors"
      >
        Start Using CRK
      </button>
    </div>
  );
}
