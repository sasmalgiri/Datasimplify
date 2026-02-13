'use client';

import { createContext, useContext, useReducer, ReactNode } from 'react';

export interface WizardState {
  currentStep: number;
  templateId: string;
  templateName: string;

  // Step 2: Auth
  email: string;
  isAuthenticated: boolean;
  turnstileToken: string | null;

  // Step 3: Configuration
  selectedCoins: string[];
  selectedMetrics: string[];
  dashboardLayout: 'compact' | 'detailed' | 'charts';

  // Step 4: API Key
  apiKey: string;
  apiKeyValidated: boolean;
  apiKeyType: 'demo' | 'pro' | null;

  // Step 5: Download
  downloadFormat: 'xlsx' | 'xlsm';
  contentType: 'native_charts' | 'formulas_only';
  isDownloading: boolean;
  downloadComplete: boolean;
}

export type WizardAction =
  | { type: 'SET_STEP'; step: number }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'SET_EMAIL'; email: string }
  | { type: 'SET_AUTHENTICATED'; authenticated: boolean }
  | { type: 'SET_TURNSTILE_TOKEN'; token: string | null }
  | { type: 'SET_COINS'; coins: string[] }
  | { type: 'SET_METRICS'; metrics: string[] }
  | { type: 'SET_LAYOUT'; layout: 'compact' | 'detailed' | 'charts' }
  | { type: 'SET_API_KEY'; apiKey: string }
  | { type: 'SET_API_KEY_VALIDATED'; validated: boolean }
  | { type: 'SET_API_KEY_TYPE'; keyType: 'demo' | 'pro' | null }
  | { type: 'SET_DOWNLOAD_FORMAT'; format: 'xlsx' | 'xlsm' }
  | { type: 'SET_CONTENT_TYPE'; contentType: 'native_charts' | 'formulas_only' }
  | { type: 'SET_DOWNLOADING'; downloading: boolean }
  | { type: 'SET_DOWNLOAD_COMPLETE'; complete: boolean }
  | { type: 'RESET' };

const TOTAL_STEPS = 6;

const initialState: WizardState = {
  currentStep: 1,
  templateId: '',
  templateName: '',
  email: '',
  isAuthenticated: false,
  turnstileToken: null,
  selectedCoins: ['bitcoin', 'ethereum'],
  selectedMetrics: ['price', 'market_cap', 'volume_24h', 'change_24h'],
  dashboardLayout: 'detailed',
  apiKey: '',
  apiKeyValidated: false,
  apiKeyType: null,
  downloadFormat: 'xlsx',
  contentType: 'native_charts',
  isDownloading: false,
  downloadComplete: false,
};

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: Math.max(1, Math.min(TOTAL_STEPS, action.step)) };
    case 'NEXT_STEP':
      return { ...state, currentStep: Math.min(TOTAL_STEPS, state.currentStep + 1) };
    case 'PREV_STEP':
      return { ...state, currentStep: Math.max(1, state.currentStep - 1) };
    case 'SET_EMAIL':
      return { ...state, email: action.email };
    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.authenticated };
    case 'SET_TURNSTILE_TOKEN':
      return { ...state, turnstileToken: action.token };
    case 'SET_COINS':
      return { ...state, selectedCoins: action.coins };
    case 'SET_METRICS':
      return { ...state, selectedMetrics: action.metrics };
    case 'SET_LAYOUT':
      return { ...state, dashboardLayout: action.layout };
    case 'SET_API_KEY':
      return { ...state, apiKey: action.apiKey, apiKeyValidated: false, apiKeyType: null };
    case 'SET_API_KEY_VALIDATED':
      return { ...state, apiKeyValidated: action.validated };
    case 'SET_API_KEY_TYPE':
      return { ...state, apiKeyType: action.keyType };
    case 'SET_DOWNLOAD_FORMAT':
      return { ...state, downloadFormat: action.format };
    case 'SET_CONTENT_TYPE':
      return { ...state, contentType: action.contentType };
    case 'SET_DOWNLOADING':
      return { ...state, isDownloading: action.downloading };
    case 'SET_DOWNLOAD_COMPLETE':
      return { ...state, downloadComplete: action.complete };
    case 'RESET':
      return { ...initialState, templateId: state.templateId, templateName: state.templateName };
    default:
      return state;
  }
}

interface WizardContextType {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
  canGoNext: boolean;
  canGoPrev: boolean;
  totalSteps: number;
}

const WizardContext = createContext<WizardContextType | null>(null);

export function WizardProvider({
  children,
  templateId,
  templateName,
  initialEmail,
  isAuthenticated,
}: {
  children: ReactNode;
  templateId: string;
  templateName: string;
  initialEmail?: string;
  isAuthenticated?: boolean;
}) {
  const [state, dispatch] = useReducer(wizardReducer, {
    ...initialState,
    templateId,
    templateName,
    email: initialEmail || '',
    isAuthenticated: isAuthenticated || false,
  });

  // Determine if user can proceed to next step
  // Step order: Welcome → Email → Configure → API Key → Download → Success
  const canGoNext = (() => {
    switch (state.currentStep) {
      case 1: // Welcome
        return true;
      case 2: // Email
        return state.isAuthenticated && state.email.includes('@');
      case 3: // Configure
        return state.selectedCoins.length > 0 && state.selectedMetrics.length > 0;
      case 4: // API Key
        return state.apiKeyValidated && state.apiKey.length > 0;
      case 5: // Download
        return !state.isDownloading;
      case 6: // Success
        return false;
      default:
        return true;
    }
  })();

  const canGoPrev = state.currentStep > 1 && state.currentStep < 6;

  return (
    <WizardContext.Provider value={{ state, dispatch, canGoNext, canGoPrev, totalSteps: TOTAL_STEPS }}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within a WizardProvider');
  }
  return context;
}

export const STEP_TITLES = [
  'Welcome',
  'Account',
  'Configure',
  'API Key',
  'Download',
  'Success',
];
