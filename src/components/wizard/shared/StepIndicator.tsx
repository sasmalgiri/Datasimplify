'use client';

import { useWizard, STEP_TITLES } from '../WizardContext';
import { Check } from 'lucide-react';

export function StepIndicator() {
  const { state, totalSteps } = useWizard();
  const { currentStep } = state;

  return (
    <div className="px-6 py-4 border-b border-gray-700">
      <div className="flex items-center justify-between">
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
                    mt-1 text-xs hidden sm:block
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
                    w-8 sm:w-12 md:w-16 h-0.5 mx-1 sm:mx-2
                    transition-all duration-200
                    ${stepNumber < currentStep ? 'bg-emerald-500' : 'bg-gray-700'}
                  `}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile step title */}
      <div className="mt-3 sm:hidden text-center">
        <span className="text-emerald-400 font-medium">
          Step {currentStep}: {STEP_TITLES[currentStep - 1]}
        </span>
      </div>
    </div>
  );
}
