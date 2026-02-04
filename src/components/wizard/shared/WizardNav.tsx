'use client';

import { useWizard } from '../WizardContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface WizardNavProps {
  onSkip?: () => void;
  skipLabel?: string;
  nextLabel?: string;
  showSkip?: boolean;
}

export function WizardNav({
  onSkip,
  skipLabel = 'Skip for now',
  nextLabel = 'Continue',
  showSkip = false,
}: WizardNavProps) {
  const { state, dispatch, canGoNext, canGoPrev } = useWizard();
  const { currentStep, isDownloading } = state;

  // Don't show navigation on success step
  if (currentStep === 7) {
    return null;
  }

  const handleNext = () => {
    if (canGoNext) {
      dispatch({ type: 'NEXT_STEP' });
    }
  };

  const handlePrev = () => {
    if (canGoPrev) {
      dispatch({ type: 'PREV_STEP' });
    }
  };

  return (
    <div className="px-6 py-4 border-t border-gray-700 flex items-center justify-between">
      {/* Back Button */}
      <div>
        {canGoPrev && (
          <button
            type="button"
            onClick={handlePrev}
            disabled={isDownloading}
            className="flex items-center gap-1 px-4 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
        )}
      </div>

      {/* Right side buttons */}
      <div className="flex items-center gap-3">
        {/* Skip Button */}
        {showSkip && onSkip && (
          <button
            type="button"
            onClick={onSkip}
            disabled={isDownloading}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm disabled:opacity-50"
          >
            {skipLabel}
          </button>
        )}

        {/* Next/Continue Button */}
        <button
          type="button"
          onClick={handleNext}
          disabled={!canGoNext || isDownloading}
          className={`
            flex items-center gap-1 px-6 py-2 rounded-lg font-medium transition-all
            ${canGoNext && !isDownloading
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {nextLabel}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
