import { NextResponse } from 'next/server';
import { fetchMacroData, getRiskInterpretation, type MacroData } from '@/lib/macroData';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getMacroDataFromCache, saveMacroDataToCache } from '@/lib/supabaseData';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // 5 minutes

export async function GET() {
  try {
    // 1. Try cache first
    if (isSupabaseConfigured) {
      const cached = await getMacroDataFromCache();
      if (cached && cached.length > 0) {
        // Rebuild MacroData from cache
        const cachedData: MacroData = {
          fedFundsRate: cached.find(i => i.indicator === 'fedFundsRate')?.value ?? null,
          treasury10Y: cached.find(i => i.indicator === 'treasury10Y')?.value ?? null,
          dxy: cached.find(i => i.indicator === 'dxy')?.value ?? null,
          vix: cached.find(i => i.indicator === 'vix')?.value ?? null,
          sp500Change: cached.find(i => i.indicator === 'sp500Change')?.value ?? null,
          nasdaqChange: cached.find(i => i.indicator === 'nasdaqChange')?.value ?? null,
          lastUpdated: cached[0].updated_at,
          riskEnvironment: 'neutral',
          dataQuality: 'good'
        };

        // Determine risk environment
        let riskScore = 0;
        if (cachedData.vix !== null) {
          if (cachedData.vix < 15) riskScore += 1;
          else if (cachedData.vix > 25) riskScore -= 1;
        }
        if (cachedData.sp500Change !== null && cachedData.sp500Change > 0.5) riskScore += 1;
        if (cachedData.nasdaqChange !== null && cachedData.nasdaqChange > 0.5) riskScore += 1;
        cachedData.riskEnvironment = riskScore >= 2 ? 'risk-on' : riskScore <= -2 ? 'risk-off' : 'neutral';

        const interpretation = getRiskInterpretation(cachedData);
        return NextResponse.json({
          success: true,
          data: { ...cachedData, interpretation, source: 'cache' }
        });
      }
    }

    // 2. Fetch from external APIs
    const data = await fetchMacroData();
    const interpretation = getRiskInterpretation(data);

    // 3. Save to cache
    if (isSupabaseConfigured) {
      const indicators = [
        { indicator: 'fedFundsRate', value: data.fedFundsRate ?? 0, previousValue: 0, change: 0, source: 'FRED' },
        { indicator: 'treasury10Y', value: data.treasury10Y ?? 0, previousValue: 0, change: 0, source: 'FRED' },
        { indicator: 'dxy', value: data.dxy ?? 0, previousValue: 0, change: 0, source: 'FRED' },
        { indicator: 'vix', value: data.vix ?? 0, previousValue: 0, change: 0, source: 'Yahoo Finance' },
        { indicator: 'sp500Change', value: data.sp500Change ?? 0, previousValue: 0, change: 0, source: 'Yahoo Finance' },
        { indicator: 'nasdaqChange', value: data.nasdaqChange ?? 0, previousValue: 0, change: 0, source: 'Yahoo Finance' }
      ];
      await saveMacroDataToCache(indicators);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        interpretation,
        source: 'api'
      }
    });
  } catch (error) {
    console.error('Macro API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch macro data',
        data: null
      },
      { status: 500 }
    );
  }
}
