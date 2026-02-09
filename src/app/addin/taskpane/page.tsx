'use client';

import { useState, useEffect, useCallback } from 'react';
import { OnboardingWizard } from '@/components/addin/OnboardingWizard';

/**
 * CryptoReportKit Excel Add-in Taskpane
 *
 * Supports both:
 * 1. Formula mode - Uses CRK.PRICE(), CRK.OHLCV() etc formulas
 * 2. Pack mode - Pre-built workbooks with __CRK__ sheet containing recipe
 *
 * Uses Office Dialog API for authentication (more secure than embedded login)
 * Stores token in OfficeRuntime.storage (persists across sessions)
 */

type Provider = 'coingecko';

type WorkbookMode = 'formula' | 'pack' | 'unknown';

interface ProviderStatus {
  connected: boolean;
  hint?: string;
  isValid?: boolean;
}

interface UserData {
  email: string;
}

interface PackRecipe {
  id: string;
  name: string;
  coins: string[];
  metrics: string[];
  currency: string;
  ohlcv_days?: number;
  movers_count?: number;
  include_global?: boolean;
}

// Declare Office types
declare const Office: {
  onReady: (callback: (info: { host: string }) => void) => void;
  context: {
    ui: {
      displayDialogAsync: (
        url: string,
        options: { height: number; width: number },
        callback: (result: { status: string; value: { addEventHandler: (event: number, handler: (arg: { message: string }) => void) => void; close: () => void } }) => void
      ) => void;
      messageParent: (message: string) => void;
    };
  };
  EventType: {
    DialogMessageReceived: number;
  };
};

declare const OfficeRuntime: {
  storage: {
    getItem: (key: string) => Promise<string | null>;
    setItem: (key: string, value: string) => Promise<void>;
    removeItem: (key: string) => Promise<void>;
  };
};

declare const Excel: {
  run: <T>(callback: (context: ExcelContext) => Promise<T>) => Promise<T>;
};

interface ExcelWorksheet {
  name: string;
  getRange: (address: string) => ExcelRange;
  getUsedRange: () => ExcelRange;
}

interface ExcelRange {
  values: unknown[][];
  load: (properties: string) => void;
}

interface ExcelContext {
  workbook: {
    application: {
      calculate: (type: string) => void;
    };
    getSelectedRange: () => { formulas: string[][] };
    worksheets: {
      getItemOrNullObject: (name: string) => ExcelWorksheet & { isNullObject: boolean; load: (props: string) => void };
      getItem: (name: string) => ExcelWorksheet;
    };
  };
  sync: () => Promise<void>;
}

export default function TaskpanePage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [providers, setProviders] = useState<Record<Provider, ProviderStatus>>({
    coingecko: { connected: false },
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [officeReady, setOfficeReady] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [workbookMode, setWorkbookMode] = useState<WorkbookMode>('unknown');
  const [packRecipe, setPackRecipe] = useState<PackRecipe | null>(null);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [planData, setPlanData] = useState<{
    plan: string;
    displayName: string;
    limits: { dailyApiCalls: number; maxCoinsPerRequest: number };
    quotas: {
      apiCalls: { used: number; limit: number; remaining: number; resetAt: string };
    };
    coingeckoLimits?: {
      free: { callsPerMinute: number };
      pro: { callsPerMinute: number };
      hasProKey: boolean;
    };
  } | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const [localUsageCount, setLocalUsageCount] = useState<number | null>(null);

  // Initialize Office.js and check for existing token
  useEffect(() => {
    const init = async () => {
      try {
        if (typeof Office !== 'undefined') {
          Office.onReady(async () => {
            setOfficeReady(true);

            // Check for existing token in OfficeRuntime.storage
            try {
              if (typeof OfficeRuntime !== 'undefined') {
                const token = await OfficeRuntime.storage.getItem('crk_auth_token');
                const email = await OfficeRuntime.storage.getItem('crk_user_email');
                const onboardingDone = await OfficeRuntime.storage.getItem('crk_onboarding_complete');

                if (token && email) {
                  setUser({ email });
                }

                // Show onboarding if not completed
                if (onboardingDone !== 'true') {
                  setShowOnboarding(true);
                } else {
                  setOnboardingComplete(true);
                }
              }
            } catch (err) {
              console.log('No stored token found');
              // Show onboarding on first load
              setShowOnboarding(true);
            }

            setIsLoading(false);
          });
        } else {
          // Not in Office - check localStorage for dev mode
          const token = localStorage.getItem('crk_auth_token');
          const email = localStorage.getItem('crk_user_email');
          const onboardingDone = localStorage.getItem('crk_onboarding_complete');

          if (token && email) {
            setUser({ email });
          }

          // Show onboarding if not completed
          if (onboardingDone !== 'true') {
            setShowOnboarding(true);
          } else {
            setOnboardingComplete(true);
          }

          setIsLoading(false);
        }
      } catch {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  // Open Office Dialog for authentication
  const handleSignIn = () => {
    setIsSigningIn(true);
    setError(null);

    const authUrl = `${window.location.origin}/addin-auth`;

    if (typeof Office !== 'undefined' && officeReady) {
      // Use Office Dialog API
      Office.context.ui.displayDialogAsync(
        authUrl,
        { height: 60, width: 30 },
        (asyncResult) => {
          if (asyncResult.status === 'failed') {
            setError('Failed to open login dialog');
            setIsSigningIn(false);
            return;
          }

          const dialog = asyncResult.value;

          dialog.addEventHandler(Office.EventType.DialogMessageReceived, async (arg) => {
            try {
              const message = JSON.parse(arg.message);

              if (message.type === 'CRK_TOKEN') {
                // Store token in OfficeRuntime.storage
                if (typeof OfficeRuntime !== 'undefined') {
                  await OfficeRuntime.storage.setItem('crk_auth_token', message.access_token);
                  await OfficeRuntime.storage.setItem('crk_user_email', message.email);
                }

                // Also store in localStorage as fallback
                localStorage.setItem('crk_auth_token', message.access_token);
                localStorage.setItem('crk_user_email', message.email);

                setUser({ email: message.email });
                dialog.close();
              }
            } catch (err) {
              console.error('Error processing dialog message:', err);
            } finally {
              setIsSigningIn(false);
            }
          });
        }
      );
    } else {
      // Fallback: Open in new window for development
      const popup = window.open(authUrl, 'CRK_Auth', 'width=400,height=600');

      // Listen for message from popup
      const handleMessage = async (event: MessageEvent) => {
        if (event.data?.type === 'CRK_TOKEN') {
          localStorage.setItem('crk_auth_token', event.data.access_token);
          localStorage.setItem('crk_user_email', event.data.email);
          setUser({ email: event.data.email });
          popup?.close();
          window.removeEventListener('message', handleMessage);
          setIsSigningIn(false);
        }
      };

      window.addEventListener('message', handleMessage);

      // Timeout after 5 minutes
      setTimeout(() => {
        window.removeEventListener('message', handleMessage);
        setIsSigningIn(false);
      }, 300000);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      if (typeof OfficeRuntime !== 'undefined') {
        await OfficeRuntime.storage.removeItem('crk_auth_token');
        await OfficeRuntime.storage.removeItem('crk_user_email');
      }
    } catch {
      // Ignore storage errors
    }

    localStorage.removeItem('crk_auth_token');
    localStorage.removeItem('crk_user_email');
    setUser(null);
  };

  // Load provider status when user is authenticated
  const loadProviderStatus = useCallback(async () => {
    if (!user) return;

    const providerList: Provider[] = ['coingecko'];
    const status: Record<Provider, ProviderStatus> = {
      coingecko: { connected: false },
    };

    for (const provider of providerList) {
      try {
        const res = await fetch(`/api/v1/keys/${provider}`);
        if (res.ok) {
          status[provider] = await res.json();
        }
      } catch {
        // Keep default disconnected state
      }
    }

    setProviders(status);
  }, [user]);

  // Load plan data (quotas, limits, usage)
  const loadPlanData = useCallback(async () => {
    if (!user) return;

    setUsageLoading(true);
    try {
      let token: string | null = null;
      try {
        if (typeof OfficeRuntime !== 'undefined') {
          token = await OfficeRuntime.storage.getItem('crk_auth_token');
        }
        if (!token) token = localStorage.getItem('crk_auth_token');
      } catch {
        token = localStorage.getItem('crk_auth_token');
      }

      if (!token) return;

      const res = await fetch('/api/v1/me/plan', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPlanData({
          plan: data.subscription?.plan || 'free',
          displayName: data.subscription?.displayName || 'Free',
          limits: data.subscription?.limits || { dailyApiCalls: 100, maxCoinsPerRequest: 10 },
          quotas: data.quotas || { apiCalls: { used: 0, limit: 100, remaining: 100, resetAt: '' } },
          coingeckoLimits: data.coingeckoLimits,
        });
      }
    } catch (err) {
      console.error('Failed to load plan data:', err);
    } finally {
      setUsageLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadProviderStatus();
      loadPlanData();

      // Refresh plan data every 60 seconds
      const interval = setInterval(loadPlanData, 60000);
      return () => clearInterval(interval);
    }
  }, [user, loadProviderStatus, loadPlanData]);

  // Poll local usage counter from OfficeRuntime.storage every 5 seconds
  // This provides near-real-time updates without waiting for server round-trip
  useEffect(() => {
    if (!user) return;

    const pollLocalUsage = async () => {
      try {
        let count: string | null = null;
        let date: string | null = null;
        const today = new Date().toISOString().split('T')[0];

        if (typeof OfficeRuntime !== 'undefined' && OfficeRuntime.storage) {
          count = await OfficeRuntime.storage.getItem('crk_usage_today');
          date = await OfficeRuntime.storage.getItem('crk_usage_date');
        } else {
          count = localStorage.getItem('crk_usage_today');
          date = localStorage.getItem('crk_usage_date');
        }

        if (date === today && count) {
          setLocalUsageCount(parseInt(count, 10) || 0);
        } else {
          setLocalUsageCount(0);
        }
      } catch {
        // Non-critical - fall back to server data
      }
    };

    pollLocalUsage();
    const interval = setInterval(pollLocalUsage, 5000);
    return () => clearInterval(interval);
  }, [user]);

  // Detect workbook mode (pack vs formula)
  const detectWorkbookMode = useCallback(async () => {
    if (!officeReady || typeof Excel === 'undefined') {
      setWorkbookMode('formula'); // Default to formula mode outside Office
      return;
    }

    try {
      await Excel.run(async (context) => {
        // Try to get the __CRK__ sheet
        const crkSheet = context.workbook.worksheets.getItemOrNullObject('__CRK__');
        crkSheet.load('isNullObject');
        await context.sync();

        if (crkSheet.isNullObject) {
          setWorkbookMode('formula');
          setPackRecipe(null);
        } else {
          // Read recipe from __CRK__ sheet
          const recipeRange = crkSheet.getRange('B1');
          recipeRange.load('values');
          await context.sync();

          const recipeJson = recipeRange.values[0][0] as string;
          if (recipeJson) {
            try {
              const recipe = JSON.parse(recipeJson) as PackRecipe;
              setPackRecipe(recipe);
              setWorkbookMode('pack');
            } catch {
              setWorkbookMode('formula');
            }
          } else {
            setWorkbookMode('formula');
          }
        }
      });
    } catch (err) {
      console.error('Error detecting workbook mode:', err);
      setWorkbookMode('formula');
    }
  }, [officeReady]);

  // Detect mode when Office is ready
  useEffect(() => {
    if (officeReady) {
      detectWorkbookMode();
    }
  }, [officeReady, detectWorkbookMode]);

  // Refresh all data - handles both formula and pack modes
  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      if (workbookMode === 'pack' && packRecipe) {
        // Pack mode: Call /api/v1/report/run and populate data
        await refreshPack();
      } else {
        // Formula mode: Recalculate all formulas
        if (officeReady && typeof Excel !== 'undefined') {
          await Excel.run(async (context) => {
            context.workbook.application.calculate('Full');
            await context.sync();
          });
        }
      }
      setLastRefresh(new Date().toLocaleTimeString());
    } catch (err) {
      setError('Failed to refresh. Please try again.');
      console.error('Refresh error:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle onboarding completion
  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);
    setOnboardingComplete(true);

    // Store completion status
    try {
      if (typeof OfficeRuntime !== 'undefined') {
        await OfficeRuntime.storage.setItem('crk_onboarding_complete', 'true');
      }
      localStorage.setItem('crk_onboarding_complete', 'true');
    } catch (err) {
      console.error('Failed to save onboarding status:', err);
    }
  };

  // Handle onboarding skip
  const handleOnboardingSkip = async () => {
    // Same as complete - don't show again
    await handleOnboardingComplete();
  };

  // Reopen onboarding
  const handleReopenOnboarding = () => {
    setShowOnboarding(true);
  };

  // Refresh pack by calling /api/v1/report/run
  const refreshPack = async () => {
    if (!packRecipe) return;

    // Get auth token
    let token: string | null = null;
    try {
      if (typeof OfficeRuntime !== 'undefined') {
        token = await OfficeRuntime.storage.getItem('crk_auth_token');
      }
      if (!token) {
        token = localStorage.getItem('crk_auth_token');
      }
    } catch {
      token = localStorage.getItem('crk_auth_token');
    }

    if (!token) {
      throw new Error('Not authenticated');
    }

    // Call report/run API
    const response = await fetch('/api/v1/report/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ recipe: packRecipe }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch data');
    }

    const data = await response.json();

    // Populate data into Excel
    await Excel.run(async (context) => {
      // Populate prices into Market Data sheet
      if (data.tables.prices) {
        const dataSheet = context.workbook.worksheets.getItem('Market Data');
        const prices = data.tables.prices;

        for (let i = 0; i < prices.length; i++) {
          const rowNum = i + 2; // Start at row 2 (after header)
          const priceData = prices[i];

          // Update cells
          dataSheet.getRange(`C${rowNum}`).values = [[priceData.price]];
          dataSheet.getRange(`D${rowNum}`).values = [[priceData.change_24h / 100]]; // Convert to decimal for %
          dataSheet.getRange(`E${rowNum}`).values = [[priceData.market_cap_formatted]];
          dataSheet.getRange(`F${rowNum}`).values = [[priceData.volume_24h]];
        }

        await context.sync();
      }

      // Populate movers if present
      if (data.tables.movers_up && data.tables.movers_down) {
        try {
          const moversSheet = context.workbook.worksheets.getItem('Movers');

          // Top gainers (rows 6-10, columns B-D)
          for (let i = 0; i < data.tables.movers_up.length; i++) {
            const mover = data.tables.movers_up[i];
            const rowNum = 6 + i;
            moversSheet.getRange(`B${rowNum}`).values = [[mover.coin.toUpperCase()]];
            moversSheet.getRange(`C${rowNum}`).values = [[mover.price]];
            moversSheet.getRange(`D${rowNum}`).values = [[`+${mover.change_24h.toFixed(2)}%`]];
          }

          // Top losers (rows 6-10, columns F-H)
          for (let i = 0; i < data.tables.movers_down.length; i++) {
            const mover = data.tables.movers_down[i];
            const rowNum = 6 + i;
            moversSheet.getRange(`F${rowNum}`).values = [[mover.coin.toUpperCase()]];
            moversSheet.getRange(`G${rowNum}`).values = [[mover.price]];
            moversSheet.getRange(`H${rowNum}`).values = [[`${mover.change_24h.toFixed(2)}%`]];
          }

          await context.sync();
        } catch {
          // Movers sheet might not exist
        }
      }

      // Update last refresh timestamp in __CRK__ sheet
      try {
        const crkSheet = context.workbook.worksheets.getItem('__CRK__');
        crkSheet.getRange('B5').values = [[new Date().toISOString()]];
        await context.sync();
      } catch {
        // Ignore if __CRK__ sheet doesn't exist
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4 flex flex-col items-center justify-center">
        <div className="w-16 h-16 mb-4 bg-emerald-500/20 rounded-full flex items-center justify-center">
          <span className="text-2xl">📊</span>
        </div>
        <h1 className="text-xl font-bold mb-2">CryptoReportKit</h1>
        <p className="text-gray-400 text-sm mb-6 text-center">
          Sign in to use CRK functions in your spreadsheet
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded text-red-400 text-sm max-w-xs text-center">
            {error}
          </div>
        )}

        <button
          onClick={handleSignIn}
          disabled={isSigningIn}
          className="w-full max-w-xs py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
        >
          {isSigningIn ? 'Opening login...' : 'Sign In'}
        </button>

        <p className="text-xs text-center text-gray-500 mt-4">
          Don&apos;t have an account?{' '}
          <a
            href="https://cryptoreportkit.com/signup"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:underline"
          >
            Sign up
          </a>
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Onboarding Wizard Overlay */}
      {showOnboarding && (
        <OnboardingWizard
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
          onSignIn={handleSignIn}
          isSigningIn={isSigningIn}
        />
      )}

      <div className="min-h-screen bg-gray-900 text-white p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold">CryptoReportKit</h1>
          <p className="text-xs text-gray-400 truncate max-w-[180px]">{user.email}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="text-xs text-gray-400 hover:text-white px-2 py-1"
        >
          Sign out
        </button>
      </div>

      {/* Usage Dashboard */}
      <UsageDashboard planData={planData} loading={usageLoading} localUsageCount={localUsageCount} />

      {/* Workbook Mode Indicator */}
      {workbookMode === 'pack' && packRecipe && (
        <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-emerald-400 text-lg">📊</span>
            <span className="text-sm font-medium text-emerald-400">Pack Mode</span>
          </div>
          <p className="text-xs text-gray-400">{packRecipe.name}</p>
          <p className="text-xs text-gray-500">{packRecipe.coins.length} coins tracked</p>
        </div>
      )}

      {workbookMode === 'formula' && (
        <div className="mb-4 p-3 bg-gray-800 border border-gray-700 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-gray-400 text-lg">📝</span>
            <span className="text-sm font-medium text-gray-300">Formula Mode</span>
          </div>
          <p className="text-xs text-gray-500">Using CRK.PRICE(), CRK.OHLCV() formulas</p>
        </div>
      )}

      {/* Refresh Button */}
      <button
        onClick={handleRefreshAll}
        disabled={isRefreshing}
        className="w-full py-3 mb-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
      >
        {isRefreshing ? 'Refreshing...' : 'Refresh All Data'}
      </button>

      {lastRefresh && (
        <p className="text-xs text-gray-500 text-center mb-4">
          Last refresh: {lastRefresh}
        </p>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Provider Keys */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold mb-3">API Keys</h2>
        <div className="space-y-2">
          {(['coingecko'] as Provider[]).map((provider) => (
            <ProviderKeyRow
              key={provider}
              provider={provider}
              status={providers[provider]}
              onUpdate={loadProviderStatus}
            />
          ))}
        </div>
        <div className="text-xs text-gray-500 mt-2">
          <p>Connect your own API keys for higher rate limits (BYOK).</p>
          <a
            href="https://cryptoreportkit.com/byok"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
          >
            How to get a CoinGecko API key ↗
          </a>
        </div>
      </div>

      {/* Quick Insert - Categorized */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold mb-3">Quick Insert</h2>

        <p className="text-[10px] text-gray-500 mb-2 uppercase tracking-wider">Price & Market</p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <QuickInsertButton formula='=CRK.PRICE("bitcoin")' label="BTC Price" officeReady={officeReady} />
          <QuickInsertButton formula='=CRK.PRICE("ethereum")' label="ETH Price" officeReady={officeReady} />
          <QuickInsertButton formula='=CRK.CHANGE24H("bitcoin")' label="BTC 24h%" officeReady={officeReady} />
          <QuickInsertButton formula='=CRK.MARKETCAP("bitcoin")' label="BTC MCap" officeReady={officeReady} />
          <QuickInsertButton formula='=CRK.VOLUME("bitcoin")' label="BTC Volume" officeReady={officeReady} />
          <QuickInsertButton formula='=CRK.OHLCV("bitcoin",30)' label="BTC OHLCV" officeReady={officeReady} />
        </div>

        <p className="text-[10px] text-gray-500 mb-2 uppercase tracking-wider">Technical</p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <QuickInsertButton formula='=CRK.RSI("bitcoin",14)' label="BTC RSI" officeReady={officeReady} />
          <QuickInsertButton formula='=CRK.SMA("bitcoin",20)' label="BTC SMA20" officeReady={officeReady} />
          <QuickInsertButton formula='=CRK.EMA("bitcoin",20)' label="BTC EMA20" officeReady={officeReady} />
          <QuickInsertButton formula='=CRK.BB("bitcoin",20)' label="BTC Bollinger" officeReady={officeReady} />
        </div>

        <p className="text-[10px] text-gray-500 mb-2 uppercase tracking-wider">Market</p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <QuickInsertButton formula='=CRK.GLOBAL("total_market_cap")' label="Total MCap" officeReady={officeReady} />
          <QuickInsertButton formula='=CRK.GLOBAL("btc_dominance")' label="BTC Dominance" officeReady={officeReady} />
          <QuickInsertButton formula='=CRK.FEARGREED()' label="Fear & Greed" officeReady={officeReady} />
          <QuickInsertButton formula='=CRK.TRENDING()' label="Trending" officeReady={officeReady} />
        </div>

        <p className="text-[10px] text-gray-500 mb-2 uppercase tracking-wider">Discovery</p>
        <div className="grid grid-cols-2 gap-2">
          <QuickInsertButton formula='=CRK.TOP(20)' label="Top 20" officeReady={officeReady} />
          <QuickInsertButton formula='=CRK.GAINERS(10)' label="Top Gainers" officeReady={officeReady} />
          <QuickInsertButton formula='=CRK.LOSERS(10)' label="Top Losers" officeReady={officeReady} />
          <QuickInsertButton formula='=CRK.DEFI_TOP(10)' label="DeFi Top 10" officeReady={officeReady} />
        </div>
      </div>

      {/* Function Reference - Collapsible Categories */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold mb-3">Function Reference</h2>
        <div className="space-y-1">
          <FunctionCategory title="Price & Market" tier="free" functions={[
            { name: 'CRK.PRICE', args: 'coin, [currency]', example: '=CRK.PRICE("bitcoin")' },
            { name: 'CRK.CHANGE24H', args: 'coin', example: '=CRK.CHANGE24H("ethereum")' },
            { name: 'CRK.MARKETCAP', args: 'coin, [currency]', example: '=CRK.MARKETCAP("bitcoin")' },
            { name: 'CRK.VOLUME', args: 'coin, [currency]', example: '=CRK.VOLUME("bitcoin")' },
            { name: 'CRK.OHLCV', args: 'coin, [days], [currency]', example: '=CRK.OHLCV("bitcoin",30)' },
          ]} />
          <FunctionCategory title="Coin Details" tier="free" functions={[
            { name: 'CRK.INFO', args: 'coin, field', example: '=CRK.INFO("bitcoin","rank")' },
            { name: 'CRK.RANK', args: 'coin', example: '=CRK.RANK("bitcoin")' },
            { name: 'CRK.SEARCH', args: 'query', example: '=CRK.SEARCH("btc")' },
            { name: 'CRK.ATH', args: 'coin, [currency]', example: '=CRK.ATH("bitcoin")' },
            { name: 'CRK.ATL', args: 'coin, [currency]', example: '=CRK.ATL("bitcoin")' },
          ]} />
          <FunctionCategory title="Technical Indicators" tier="pro" functions={[
            { name: 'CRK.RSI', args: 'coin, [period]', example: '=CRK.RSI("bitcoin",14)' },
            { name: 'CRK.SMA', args: 'coin, [period]', example: '=CRK.SMA("bitcoin",20)' },
            { name: 'CRK.EMA', args: 'coin, [period]', example: '=CRK.EMA("bitcoin",20)' },
            { name: 'CRK.BB', args: 'coin, [period]', example: '=CRK.BB("bitcoin",20)' },
            { name: 'CRK.MACD', args: 'coin', example: '=CRK.MACD("bitcoin")' },
            { name: 'CRK.VWAP', args: 'coin, [days]', example: '=CRK.VWAP("bitcoin",7)' },
          ]} />
          <FunctionCategory title="Global & Sentiment" tier="free" functions={[
            { name: 'CRK.GLOBAL', args: 'metric', example: '=CRK.GLOBAL("total_market_cap")' },
            { name: 'CRK.FEARGREED', args: '', example: '=CRK.FEARGREED()' },
            { name: 'CRK.TRENDING', args: '', example: '=CRK.TRENDING()' },
            { name: 'CRK.DOMINANCE', args: '[coin]', example: '=CRK.DOMINANCE("bitcoin")' },
          ]} />
          <FunctionCategory title="Discovery & Compare" tier="pro" functions={[
            { name: 'CRK.TOP', args: '[count]', example: '=CRK.TOP(20)' },
            { name: 'CRK.GAINERS', args: '[count]', example: '=CRK.GAINERS(10)' },
            { name: 'CRK.LOSERS', args: '[count]', example: '=CRK.LOSERS(10)' },
            { name: 'CRK.DEFI_TOP', args: '[count]', example: '=CRK.DEFI_TOP(10)' },
            { name: 'CRK.COMPARE', args: 'coins, metric', example: '=CRK.COMPARE("bitcoin,ethereum","price")' },
          ]} />
        </div>
      </div>

      {/* Help Link */}
      <div className="pt-4 border-t border-gray-700">
        <a
          href="https://cryptoreportkit.com/addin/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-emerald-400 hover:text-emerald-300"
        >
          View documentation
        </a>
      </div>
    </div>
    </>
  );
}

// Provider Key Row Component
function ProviderKeyRow({
  provider,
  status,
  onUpdate,
}: {
  provider: Provider;
  status: ProviderStatus;
  onUpdate: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const providerNames: Record<Provider, string> = {
    coingecko: 'CoinGecko',
  };

  const providerUrls: Record<Provider, { signup: string; dashboard: string }> = {
    coingecko: {
      signup: 'https://www.coingecko.com/en/api/pricing',
      dashboard: 'https://www.coingecko.com/en/developers/dashboard',
    },
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/keys/${provider}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });

      if (res.ok) {
        setIsSaving(false);
        setIsVerifying(false);
        setApiKey('');
        setIsEditing(false);
        onUpdate();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to verify key');
        setIsVerifying(false);
      }
    } catch {
      setError('Network error');
      setIsVerifying(false);
    }
  };

  const handleRemove = async () => {
    try {
      await fetch(`/api/v1/keys/${provider}`, { method: 'DELETE' });
      onUpdate();
    } catch {
      console.error('Failed to remove key');
    }
  };

  if (isEditing) {
    return (
      <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">{providerNames[provider]}</span>
          <a
            href={providerUrls[provider].signup}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Get API Key ↗
          </a>
        </div>

        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={provider === 'coingecko' ? 'CG-xxxxxxxxxxxxxxxxxxxx' : 'Enter API key'}
          className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm mb-2 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
        />

        {error && <p className="text-xs text-red-400 mb-2">{error}</p>}

        {provider === 'coingecko' && (
          <div className="bg-amber-900/20 border border-amber-500/30 rounded p-2 mb-2">
            <p className="text-[10px] text-amber-400">
              ⚠️ Treat your API key like a password. Never share it or paste it in spreadsheet cells.
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleVerify}
            disabled={isVerifying || !apiKey}
            className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 rounded text-xs transition-colors font-medium"
          >
            {isVerifying ? 'Verifying...' : 'Verify Key'}
          </button>
          <button
            onClick={() => {
              setIsEditing(false);
              setError(null);
              setApiKey('');
            }}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
      <div className="flex items-center gap-2 flex-1">
        <span className={`w-2 h-2 rounded-full ${status.connected ? 'bg-emerald-500' : 'bg-gray-500'}`} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm">{providerNames[provider]}</span>
            {status.hint && (
              <span className="text-xs text-gray-500">****{status.hint}</span>
            )}
          </div>
          {status.connected && (
            <a
              href={providerUrls[provider].dashboard}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
            >
              View usage ↗
            </a>
          )}
        </div>
      </div>
      {status.connected ? (
        <button
          onClick={handleRemove}
          className="text-xs text-red-400 hover:text-red-300 transition-colors"
        >
          Remove
        </button>
      ) : (
        <button
          onClick={() => setIsEditing(true)}
          className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          Connect
        </button>
      )}
    </div>
  );
}

// Quick Insert Button Component
function QuickInsertButton({
  formula,
  label,
  officeReady,
}: {
  formula: string;
  label: string;
  officeReady: boolean;
}) {
  const handleClick = async () => {
    if (!officeReady || typeof Excel === 'undefined') {
      // Copy to clipboard as fallback
      await navigator.clipboard.writeText(formula);
      return;
    }

    try {
      await Excel.run(async (context) => {
        const cell = context.workbook.getSelectedRange();
        cell.formulas = [[formula]];
        await context.sync();
      });
    } catch (err) {
      console.error('Insert error:', err);
      // Copy to clipboard as fallback
      await navigator.clipboard.writeText(formula);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="p-2 bg-gray-800 hover:bg-gray-700 rounded text-xs text-left transition-colors"
      title={officeReady ? 'Click to insert' : 'Click to copy formula'}
    >
      {label}
    </button>
  );
}

// Function Help Component
function FunctionHelp({
  name,
  args,
  example,
}: {
  name: string;
  args: string;
  example: string;
}) {
  return (
    <div className="p-2 bg-gray-800 rounded">
      <div className="font-mono text-emerald-400">{name}({args})</div>
      <div className="text-gray-500 font-mono mt-1">{example}</div>
    </div>
  );
}

// Usage Dashboard Component
function UsageDashboard({
  planData,
  loading,
  localUsageCount,
}: {
  planData: {
    plan: string;
    displayName: string;
    limits: { dailyApiCalls: number; maxCoinsPerRequest: number };
    quotas: {
      apiCalls: { used: number; limit: number; remaining: number; resetAt: string };
    };
    coingeckoLimits?: {
      free: { callsPerMinute: number };
      pro: { callsPerMinute: number };
      hasProKey: boolean;
    };
  } | null;
  loading: boolean;
  localUsageCount: number | null;
}) {
  if (loading && !planData) {
    return (
      <div className="mb-4 p-3 bg-gray-800 border border-gray-700 rounded-lg animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-1/3 mb-2" />
        <div className="h-3 bg-gray-700 rounded w-2/3" />
      </div>
    );
  }

  if (!planData) return null;

  const { plan, displayName, quotas, coingeckoLimits } = planData;
  const serverUsed = quotas.apiCalls.used;
  const limit = quotas.apiCalls.limit;
  const resetAt = quotas.apiCalls.resetAt;

  // Use the higher of local count vs server count for real-time accuracy
  // Local counter updates instantly on each call, server syncs every 10 calls
  const used = localUsageCount !== null ? Math.max(localUsageCount, serverUsed) : serverUsed;
  const remaining = Math.max(0, limit - used);
  const pct = limit > 0 ? (used / limit) * 100 : 0;

  // Progress bar color
  const barColor = pct < 60 ? 'bg-emerald-500' : pct < 85 ? 'bg-yellow-500' : 'bg-red-500';

  // Plan badge color
  const badgeColor =
    plan === 'premium' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
    plan === 'pro' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
    'bg-gray-700 text-gray-400 border-gray-600';

  // Countdown to reset
  const resetTime = resetAt ? new Date(resetAt) : null;
  const now = new Date();
  const msLeft = resetTime ? resetTime.getTime() - now.getTime() : 0;
  const hoursLeft = Math.max(0, Math.floor(msLeft / 3600000));
  const minsLeft = Math.max(0, Math.floor((msLeft % 3600000) / 60000));

  const cgRate = coingeckoLimits?.hasProKey
    ? `${coingeckoLimits.pro.callsPerMinute}/min (Pro key)`
    : `${coingeckoLimits?.free.callsPerMinute || 30}/min (free key)`;

  return (
    <div className="mb-4 p-3 bg-gray-800 border border-gray-700 rounded-lg">
      {/* Plan badge + upgrade link */}
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${badgeColor}`}>
          {displayName}
        </span>
        {plan === 'free' && (
          <a
            href="https://cryptoreportkit.com/pricing"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-emerald-400 hover:text-emerald-300"
          >
            Upgrade
          </a>
        )}
      </div>

      {/* API Calls Today */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-gray-400">API Calls Today</span>
        <span className="text-[11px] text-gray-300 font-mono">{used} / {limit.toLocaleString()}</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-gray-700 rounded-full mb-1.5">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>

      {/* Remaining + reset countdown */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-gray-500">{remaining.toLocaleString()} remaining</span>
        {resetTime && msLeft > 0 && (
          <span className="text-[10px] text-gray-500">Resets in {hoursLeft}h {minsLeft}m</span>
        )}
      </div>

      {/* CoinGecko rate limit */}
      <div className="text-[10px] text-gray-500 border-t border-gray-700 pt-2">
        CoinGecko rate: {cgRate}
      </div>

      {/* Upgrade CTA when >80% used on free tier */}
      {plan === 'free' && pct > 80 && (
        <div className="mt-2 p-2 bg-amber-900/20 border border-amber-500/30 rounded">
          <p className="text-[10px] text-amber-400 font-medium mb-1">Running low on API calls</p>
          <p className="text-[10px] text-amber-400/70">
            Upgrade to Pro for 5,000 daily calls + all 70+ functions.
          </p>
          <a
            href="https://cryptoreportkit.com/pricing"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-1 text-[10px] text-emerald-400 hover:text-emerald-300 font-medium"
          >
            View plans &rarr;
          </a>
        </div>
      )}
    </div>
  );
}

// Collapsible Function Category Component
function FunctionCategory({
  title,
  tier,
  functions,
}: {
  title: string;
  tier: 'free' | 'pro';
  functions: Array<{ name: string; args: string; example: string }>;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const tierBadge = tier === 'pro' ? (
    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
      Pro
    </span>
  ) : (
    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-gray-700 text-gray-400 border border-gray-600">
      Free
    </span>
  );

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2 bg-gray-800 hover:bg-gray-750 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-300">{title}</span>
          {tierBadge}
          <span className="text-[10px] text-gray-500">({functions.length})</span>
        </div>
        <span className="text-gray-500 text-xs">{isOpen ? '▾' : '▸'}</span>
      </button>
      {isOpen && (
        <div className="p-2 space-y-1.5 bg-gray-800/50">
          {functions.map((fn) => (
            <div key={fn.name} className="p-1.5 rounded bg-gray-800">
              <div className="font-mono text-[11px] text-emerald-400">{fn.name}({fn.args})</div>
              <div className="text-gray-500 font-mono text-[10px] mt-0.5">{fn.example}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
