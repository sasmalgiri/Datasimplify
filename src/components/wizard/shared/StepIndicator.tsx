'use client';

import { useWizard, STEP_TITLES } from '../WizardContext';
import { Check } from 'lucide-react';

export function StepIndicator() {
  const { state, totalSteps } = useWizard();
  const { currentStep } = state;

  return (
    <div className="px-3 lg:px-6 py-3 lg:py-4 border-b border-gray-700">
      {/* Mobile & Tablet: Simple progress bar */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-emerald-400">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-sm text-gray-400">
            {STEP_TITLES[currentStep - 1]}
          </span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop: Full step circles */}
      <div className="hidden lg:flex items-center justify-between">
        {STEP_TITLES.map((title, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isUpcoming = stepNumber > currentStep;

          return (
            <div key={stepNumber} className="flex items-center">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    transition-all duration-200
                    ${isCompleted ? 'bg-emerald-500 text-white' : ''}
                    ${isCurrent ? 'bg-emerald-600 text-white ring-2 ring-emerald-400 ring-offset-2 ring-offset-gray-900' : ''}
                    ${isUpcoming ? 'bg-gray-700 text-gray-400' : ''}
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    stepNumber
                  )}
                </div>
                <span
                  className={`
                    mt-1 text-xs text-center max-w-[70px] truncate
                    ${isCurrent ? 'text-emerald-400 font-medium' : 'text-gray-500'}
                  `}
                >
                  {title}
                </span>
              </div>

              {/* Connector Line */}
              {stepNumber < totalSteps && (
                <div
                  className={`
                    w-8 xl:w-12 h-0.5 mx-1
                    transition-all duration-200
                    ${stepNumber < currentStep ? 'bg-emerald-500' : 'bg-gray-700'}
                  `}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
