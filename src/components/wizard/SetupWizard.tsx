'use client';

import { WizardProvider, useWizard } from './WizardContext';
import { StepIndicator } from './shared/StepIndicator';
import { WelcomeStep } from './steps/WelcomeStep';
import { EmailStep } from './steps/EmailStep';
import { ApiKeyStep } from './steps/ApiKeyStep';
import { AddinStep } from './steps/AddinStep';
import { ConfigureStep } from './steps/ConfigureStep';
import { DownloadStep } from './steps/DownloadStep';
import { SuccessStep } from './steps/SuccessStep';
import { useAuth } from '@/lib/auth';
import { X } from 'lucide-react';

interface SetupWizardProps {
  templateId: string;
  templateName: string;
  onClose: () => void;
}

function WizardContent({ onClose }: { onClose: () => void }) {
  const { state } = useWizard();

  // Render the appropriate step component
  switch (state.currentStep) {
    case 1:
      return <WelcomeStep />;
    case 2:
      return <EmailStep />;
    case 3:
      return <ApiKeyStep />;
    case 4:
      return <AddinStep />;
    case 5:
      return <ConfigureStep />;
    case 6:
      return <DownloadStep />;
    case 7:
      return <SuccessStep onClose={onClose} />;
    default:
      return <WelcomeStep />;
  }
}

function WizardHeader({ onClose, templateName }: { onClose: () => void; templateName: string }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
      <div>
        <h1 className="text-lg font-bold text-white">Setup Wizard</h1>
        <p className="text-sm text-gray-400">{templateName}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
        aria-label="Close wizard"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

export function SetupWizard({ templateId, templateName, onClose }: SetupWizardProps) {
  const { user } = useAuth();

  return (
    <div className="fixed inset-0 bg-black/80 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-900 rounded-xl max-w-2xl w-full my-8 shadow-2xl border border-gray-800 flex flex-col max-h-[90vh]">
        <WizardProvider
          templateId={templateId}
          templateName={templateName}
          initialEmail={user?.email || ''}
          isAuthenticated={!!user}
        >
          <WizardHeader onClose={onClose} templateName={templateName} />
          <StepIndicator />
          <div className="flex-1 overflow-hidden flex flex-col">
            <WizardContent onClose={onClose} />
          </div>
        </WizardProvider>
      </div>
    </div>
  );
}
