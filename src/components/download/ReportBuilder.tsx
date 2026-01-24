'use client';

import { useState, useCallback } from 'react';
import {
  REPORT_TYPE_OPTIONS,
  ASSET_SCOPE_OPTIONS,
  TIMEFRAME_OPTIONS,
  OUTPUT_FORMAT_OPTIONS,
  CRYPTOSHEETS_PLAN_OPTIONS,
  type ReportType,
  type AssetScope,
  type TimeframeOption,
  type OutputFormat,
  type CryptoSheetsPlan,
} from '@/lib/templates/reportBuilderCatalog';
import {
  selectTemplate,
  TROUBLESHOOTING_GUIDE,
  type TemplateRecommendation,
} from '@/lib/templates/reportBuilder';

// ============ TYPES ============

type WizardStep = 'report_type' | 'asset_scope' | 'timeframe' | 'output_format' | 'cryptosheets_plan' | 'result';

interface ReportBuilderProps {
  onTemplateSelect: (templateId: string, config: TemplateRecommendation['config']) => void;
  className?: string;
}

// ============ WIZARD STEP COMPONENT ============

interface StepOptionProps {
  id: string;
  label: string;
  description: string;
  icon: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  badge?: string;
}

function StepOption({ id, label, description, icon, selected, onClick, disabled, badge }: StepOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
        selected
          ? 'bg-emerald-900/30 border-emerald-500'
          : disabled
          ? 'bg-gray-800/30 border-gray-700 opacity-50 cursor-not-allowed'
          : 'bg-gray-800/50 border-gray-700 hover:border-gray-600 hover:bg-gray-800'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`font-medium ${selected ? 'text-emerald-400' : 'text-white'}`}>
              {label}
            </span>
            {badge && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/20 text-emerald-400">
                {badge}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 mt-1">{description}</p>
        </div>
        {selected && (
          <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )}
      </div>
    </button>
  );
}

// ============ MAIN COMPONENT ============

export function ReportBuilder({ onTemplateSelect, className = '' }: ReportBuilderProps) {
  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>('report_type');
  const [selections, setSelections] = useState({
    reportType: null as ReportType | null,
    assetScope: null as AssetScope | null,
    timeframe: null as TimeframeOption | null,
    outputFormat: null as OutputFormat | null,
    cryptoSheetsPlan: null as CryptoSheetsPlan | null,
  });
  const [recommendation, setRecommendation] = useState<TemplateRecommendation | null>(null);

  // Step progression
  const steps: WizardStep[] = ['report_type', 'asset_scope', 'timeframe', 'output_format', 'cryptosheets_plan', 'result'];
  const currentStepIndex = steps.indexOf(currentStep);

  // Handle selection
  const handleSelect = useCallback((field: keyof typeof selections, value: string) => {
    setSelections(prev => ({ ...prev, [field]: value }));

    // Auto-advance to next step
    const nextStepIndex = currentStepIndex + 1;
    if (nextStepIndex < steps.length - 1) {
      setCurrentStep(steps[nextStepIndex]);
    } else if (nextStepIndex === steps.length - 1) {
      // All selections made, compute recommendation
      const updatedSelections = { ...selections, [field]: value };
      if (
        updatedSelections.reportType &&
        updatedSelections.assetScope &&
        updatedSelections.timeframe &&
        updatedSelections.outputFormat &&
        updatedSelections.cryptoSheetsPlan
      ) {
        const result = selectTemplate({
          reportType: updatedSelections.reportType,
          assetScope: updatedSelections.assetScope,
          timeframe: updatedSelections.timeframe,
          outputFormat: updatedSelections.outputFormat,
          cryptoSheetsPlan: updatedSelections.cryptoSheetsPlan,
        });
        setRecommendation(result);
        setCurrentStep('result');
      }
    }
  }, [currentStepIndex, selections, steps]);

  // Go back
  const goBack = useCallback(() => {
    const prevStepIndex = currentStepIndex - 1;
    if (prevStepIndex >= 0) {
      setCurrentStep(steps[prevStepIndex]);
      setRecommendation(null);
    }
  }, [currentStepIndex, steps]);

  // Reset wizard
  const reset = useCallback(() => {
    setCurrentStep('report_type');
    setSelections({
      reportType: null,
      assetScope: null,
      timeframe: null,
      outputFormat: null,
      cryptoSheetsPlan: null,
    });
    setRecommendation(null);
  }, []);

  // Get step title
  const getStepTitle = (step: WizardStep): string => {
    switch (step) {
      case 'report_type': return 'What type of report do you need?';
      case 'asset_scope': return 'How many assets?';
      case 'timeframe': return 'What timeframe?';
      case 'output_format': return 'What output format?';
      case 'cryptosheets_plan': return 'What Excel add-in plan do you have?';
      case 'result': return 'Your Template Recommendation';
      default: return '';
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'report_type':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {REPORT_TYPE_OPTIONS.map(option => (
              <StepOption
                key={option.id}
                id={option.id}
                label={option.label}
                description={option.description}
                icon={option.icon}
                selected={selections.reportType === option.id}
                onClick={() => handleSelect('reportType', option.id)}
              />
            ))}
          </div>
        );

      case 'asset_scope':
        return (
          <div className="grid grid-cols-1 gap-3">
            {ASSET_SCOPE_OPTIONS.map(option => (
              <StepOption
                key={option.id}
                id={option.id}
                label={option.label}
                description={option.description}
                icon={option.icon}
                selected={selections.assetScope === option.id}
                onClick={() => handleSelect('assetScope', option.id)}
              />
            ))}
          </div>
        );

      case 'timeframe':
        return (
          <div className="grid grid-cols-1 gap-3">
            {TIMEFRAME_OPTIONS.map(option => (
              <StepOption
                key={option.id}
                id={option.id}
                label={option.label}
                description={option.description}
                icon={option.icon}
                selected={selections.timeframe === option.id}
                onClick={() => handleSelect('timeframe', option.id)}
                badge={option.free_safe ? 'Free OK' : 'Pro'}
              />
            ))}
          </div>
        );

      case 'output_format':
        return (
          <div className="grid grid-cols-1 gap-3">
            {OUTPUT_FORMAT_OPTIONS.map(option => (
              <StepOption
                key={option.id}
                id={option.id}
                label={option.label}
                description={option.description}
                icon={option.icon}
                selected={selections.outputFormat === option.id}
                onClick={() => handleSelect('outputFormat', option.id)}
              />
            ))}
          </div>
        );

      case 'cryptosheets_plan':
        return (
          <div className="grid grid-cols-1 gap-3">
            {CRYPTOSHEETS_PLAN_OPTIONS.map(option => (
              <StepOption
                key={option.id}
                id={option.id}
                label={option.label}
                description={option.description}
                icon={option.icon}
                selected={selections.cryptoSheetsPlan === option.id}
                onClick={() => handleSelect('cryptoSheetsPlan', option.id)}
              />
            ))}
          </div>
        );

      case 'result':
        return recommendation ? renderResult(recommendation) : null;

      default:
        return null;
    }
  };

  // Render result
  const renderResult = (rec: TemplateRecommendation) => (
    <div className="space-y-6">
      {/* Primary Recommendation */}
      <div className="bg-emerald-900/20 rounded-xl border border-emerald-500/50 p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">✨</span>
              <h3 className="text-xl font-bold text-emerald-400">{rec.primary.name}</h3>
            </div>
            <p className="text-gray-300">{rec.primary.description}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            rec.quotaEstimate === 'low' ? 'bg-emerald-500/20 text-emerald-400' :
            rec.quotaEstimate === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {rec.quotaEstimate.charAt(0).toUpperCase() + rec.quotaEstimate.slice(1)} Usage
          </span>
        </div>

        {/* Reasoning */}
        <p className="text-sm text-gray-400 mb-4">{rec.reasoning}</p>

        {/* Config Summary */}
        <div className="bg-gray-800/50 rounded-lg p-3 mb-4">
          <h4 className="text-sm font-medium text-white mb-2">Pre-configured with:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-gray-400">Assets: <span className="text-white">{rec.config.coins.length} coins</span></div>
            <div className="text-gray-400">Timeframe: <span className="text-white">{rec.config.timeframe}</span></div>
            <div className="text-gray-400">Refresh: <span className="text-white">{rec.refreshMode === 'manual' ? 'Manual (Recommended)' : 'On Open'}</span></div>
            <div className="text-gray-400">Charts: <span className="text-white">{rec.config.includeCharts ? 'Yes' : 'No'}</span></div>
          </div>
        </div>

        {/* Download Button */}
        <button
          type="button"
          onClick={() => onTemplateSelect(rec.primary.template_id, rec.config)}
          className="w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download {rec.primary.name}
        </button>
      </div>

      {/* Warnings */}
      {rec.warnings.length > 0 && (
        <div className="bg-yellow-900/20 rounded-lg border border-yellow-500/30 p-4">
          <h4 className="font-medium text-yellow-400 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Things to Note
          </h4>
          <ul className="space-y-1 text-sm text-gray-300">
            {rec.warnings.map((warning, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-yellow-400">•</span>
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Alternatives */}
      {rec.alternatives.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-3">Alternatives:</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rec.alternatives.map(alt => (
              <button
                key={alt.template_id}
                type="button"
                onClick={() => {
                  const altRec = selectTemplate({
                    reportType: selections.reportType!,
                    assetScope: selections.assetScope!,
                    timeframe: selections.timeframe!,
                    outputFormat: selections.outputFormat!,
                    cryptoSheetsPlan: selections.cryptoSheetsPlan!,
                  });
                  // Override primary with this alternative
                  onTemplateSelect(alt.template_id, altRec.config);
                }}
                className="text-left p-4 rounded-lg border border-gray-700 bg-gray-800/50 hover:border-gray-600 hover:bg-gray-800 transition-all"
              >
                <div className="font-medium text-white mb-1">{alt.name}</div>
                <p className="text-sm text-gray-400">{alt.best_for}</p>
                <div className="mt-2 flex items-center gap-2">
                  {alt.free_safe && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/20 text-emerald-400">
                      Free OK
                    </span>
                  )}
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    alt.quota_cost_estimate === 'low' ? 'bg-gray-700 text-gray-300' :
                    alt.quota_cost_estimate === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {alt.quota_cost_estimate} usage
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Setup Steps */}
      <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
        <h4 className="font-medium text-white mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          Setup Steps
        </h4>
        <ol className="space-y-2 text-sm">
          {rec.setupSteps.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {i + 1}
              </span>
              <span className="text-gray-300 pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Troubleshooting */}
      <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
        <h4 className="font-medium text-white mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Troubleshooting
        </h4>
        <div className="space-y-2 text-sm">
          {TROUBLESHOOTING_GUIDE.slice(0, 4).map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-red-400 font-mono">{item.symptom}</span>
              <span className="text-gray-500">→</span>
              <span className="text-gray-300">{item.solution}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Done / Start Over */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-700">
        <button
          type="button"
          onClick={reset}
          className="text-gray-400 hover:text-white text-sm flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Start Over
        </button>
        <div className="text-emerald-400 font-medium flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Done
        </div>
      </div>
    </div>
  );

  return (
    <div className={`bg-gray-900 rounded-xl border border-gray-800 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-900/50 to-gray-900 border-b border-gray-800 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h2 className="font-bold text-white">Report Builder</h2>
            <p className="text-sm text-gray-400">Find the right template for your needs</p>
          </div>
        </div>
      </div>

      {/* Progress */}
      {currentStep !== 'result' && (
        <div className="px-4 pt-4">
          <div className="flex items-center gap-1">
            {steps.slice(0, -1).map((step, i) => (
              <div
                key={step}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i < currentStepIndex
                    ? 'bg-emerald-500'
                    : i === currentStepIndex
                    ? 'bg-emerald-500/50'
                    : 'bg-gray-700'
                }`}
              />
            ))}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Step {currentStepIndex + 1} of {steps.length - 1}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Step Title */}
        <h3 className="text-lg font-medium text-white mb-4">{getStepTitle(currentStep)}</h3>

        {/* Step Content */}
        {renderStepContent()}

        {/* Navigation */}
        {currentStep !== 'result' && currentStepIndex > 0 && (
          <button
            type="button"
            onClick={goBack}
            className="mt-4 text-gray-400 hover:text-white text-sm flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-800/50 border-t border-gray-700 px-4 py-3">
        <p className="text-xs text-gray-500 text-center">
          Report Builder helps you select templates. We do not provide trading signals, price predictions, or investment advice.
        </p>
      </div>
    </div>
  );
}
