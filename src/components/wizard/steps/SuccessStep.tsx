'use client';

import { useWizard } from '../WizardContext';
import { CheckCircle, Puzzle, FileSpreadsheet, LogIn, Zap, ExternalLink, AlertTriangle } from 'lucide-react';

interface SuccessStepProps {
  onClose: () => void;
}

export function SuccessStep({ onClose }: SuccessStepProps) {
  const { state } = useWizard();

  const nextSteps = [
    {
      icon: Puzzle,
      title: 'Install CRK Add-in',
      description: 'Required to enable CRK formulas in Excel',
      link: '/addin/setup',
      linkText: 'View Installation Guide',
      critical: true,
    },
    {
      icon: FileSpreadsheet,
      title: 'Open Template in Excel',
      description: 'Double-click the downloaded file to open it in Microsoft Excel',
    },
    {
      icon: LogIn,
      title: 'Sign In to Add-in',
      description: 'Open the CRK panel in Excel and sign in with your account',
    },
    {
      icon: Zap,
      title: 'Data Loads Automatically',
      description: 'CRK formulas will populate with live crypto data',
    },
  ];

  return (
    <div className="flex flex-col min-h-0">
      <div className="flex-1 px-4 sm:px-6 py-6 sm:py-8 overflow-y-auto">
        <div className="max-w-lg mx-auto text-center">
          {/* Success Icon */}
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/20">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white mb-2">
            Your Template is Ready!
          </h2>
          <p className="text-gray-400 mb-8">
            <span className="text-emerald-400 font-medium">{state.templateName}</span> has been downloaded to your computer.
          </p>

          {/* Important Notice */}
          <div className="flex items-start gap-3 p-4 mb-6 bg-amber-500/10 border border-amber-500/30 rounded-lg text-left">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-200 font-medium">Add-in Required</p>
              <p className="text-xs text-amber-200/70 mt-1">
                Your template contains CRK formulas that require the CRK Add-in to work.
                Without it, you&apos;ll see #NAME? errors instead of data.
              </p>
            </div>
          </div>

          {/* Next Steps */}
          <div className="text-left mb-8">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-4 text-center">
              Complete these steps to see your data
            </h3>
            <div className="space-y-4">
              {nextSteps.map((step, index) => (
                <div
                  key={step.title}
                  className={`flex items-start gap-4 p-4 rounded-lg border ${
                    step.critical
                      ? 'bg-emerald-500/10 border-emerald-500/50'
                      : 'bg-gray-800/50 border-gray-700'
                  }`}
                >
                  <div className={`flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0 ${
                    step.critical ? 'bg-emerald-500/30' : 'bg-emerald-500/20'
                  }`}>
                    <step.icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-emerald-400">Step {index + 1}</span>
                      {step.critical && (
                        <span className="text-xs px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded">
                          Required
                        </span>
                      )}
                    </div>
                    <h4 className="font-medium text-white">{step.title}</h4>
                    <p className="text-sm text-gray-400">{step.description}</p>
                    {step.link && (
                      <a
                        href={step.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-sm text-emerald-400 hover:text-emerald-300"
                      >
                        {step.linkText}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Primary Action - Install Add-in */}
          <a
            href="/addin/setup"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
          >
            <Puzzle className="w-5 h-5" />
            Install CRK Add-in Now
            <ExternalLink className="w-4 h-4" />
          </a>

          {/* Helpful Links */}
          <div className="space-y-3 mt-4">
            <a
              href="/addin/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors text-sm"
            >
              View Formula Documentation
              <ExternalLink className="w-4 h-4" />
            </a>

            {!state.isApiKeyValid && (
              <a
                href="/byok"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors text-sm border border-blue-500/30"
              >
                Get Your API Key for Higher Rate Limits
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
