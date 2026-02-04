'use client';

import { useWizard } from '../WizardContext';
import { CheckCircle, FileSpreadsheet, RefreshCw, BookOpen, ExternalLink } from 'lucide-react';

interface SuccessStepProps {
  onClose: () => void;
}

export function SuccessStep({ onClose }: SuccessStepProps) {
  const { state } = useWizard();

  const nextSteps = [
    {
      icon: FileSpreadsheet,
      title: 'Open in Excel',
      description: 'Double-click the downloaded file to open it in Microsoft Excel',
    },
    {
      icon: RefreshCw,
      title: 'Data Updates',
      description: 'Your template includes the latest crypto data at time of download',
    },
    {
      icon: BookOpen,
      title: 'Explore & Customize',
      description: 'Modify the template to fit your needs - add coins, charts, or metrics',
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

          {/* Next Steps */}
          <div className="text-left mb-8">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-4 text-center">
              What to do next
            </h3>
            <div className="space-y-4">
              {nextSteps.map((step, index) => (
                <div
                  key={step.title}
                  className="flex items-start gap-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/20 flex-shrink-0">
                    <step.icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-emerald-400">Step {index + 1}</span>
                    </div>
                    <h4 className="font-medium text-white">{step.title}</h4>
                    <p className="text-sm text-gray-400">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Helpful Links */}
          <div className="space-y-3">
            <a
              href="/template-requirements"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors text-sm"
            >
              View Full Documentation
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
            className="mt-8 w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
