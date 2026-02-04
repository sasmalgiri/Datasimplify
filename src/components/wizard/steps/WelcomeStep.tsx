'use client';

import { useWizard } from '../WizardContext';
import { WizardNav } from '../shared/WizardNav';
import { Sparkles, Key, Download, BarChart3 } from 'lucide-react';

export function WelcomeStep() {
  const { state } = useWizard();

  const features = [
    {
      icon: Key,
      title: 'Connect API Key (Optional)',
      description: 'Free CoinGecko API key for higher rate limits',
    },
    {
      icon: BarChart3,
      title: 'Configure Your Report',
      description: 'Choose coins, metrics, and layout',
    },
    {
      icon: Download,
      title: 'Download & Use',
      description: 'Get your ready-to-use Excel template with live data',
    },
  ];

  return (
    <div className="flex flex-col min-h-0">
      <div className="flex-1 px-4 sm:px-6 py-6 sm:py-8 overflow-y-auto">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 mb-4">
            <Sparkles className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Let&apos;s Set Up Your Crypto Report
          </h2>
          <p className="text-gray-400 max-w-md mx-auto">
            This wizard will guide you through setting up{' '}
            <span className="text-emerald-400 font-medium">{state.templateName}</span>{' '}
            with live data in Excel.
          </p>
        </div>

        {/* What we'll do */}
        <div className="max-w-lg mx-auto">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-4 text-center">
            What we&apos;ll do together
          </h3>
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="flex items-start gap-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/20 flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-emerald-400">Step {index + 1}</span>
                  </div>
                  <h4 className="font-medium text-white">{feature.title}</h4>
                  <p className="text-sm text-gray-400">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Time estimate */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Takes about 2 minutes to complete
          </p>
        </div>
      </div>

      <WizardNav nextLabel="Get Started" />
    </div>
  );
}
