/**
 * DeFi Position Tracking Endpoint
 *
 * GET /api/v1/defi/positions?address=0x...&chains=ethereum,arbitrum
 *
 * Aggregates DeFi positions using DeBank-style open APIs and DeFi Llama.
 * Returns LP positions, staking, lending, and yield farming data.
 */

import { NextRequest, NextResponse } from 'next/server';

interface DefiPosition {
  protocol: string;
  protocolLogo?: string;
  chain: string;
  type: 'liquidity' | 'staking' | 'lending' | 'farming' | 'vesting' | 'deposit';
  tokens: { symbol: string; amount: number; usdValue: number }[];
  totalUsdValue: number;
  apy?: number;
  healthFactor?: number;
  rewardsUnclaimed?: { symbol: string; amount: number; usdValue: number }[];
}

interface PositionSummary {
  address: string;
  chains: string[];
  totalValue: number;
  positions: DefiPosition[];
  lastUpdated: string;
}

/* ── Fetch DeFi Llama yields data ── */

async function fetchYieldPools(): Promise<Map<string, { apy: number; tvl: number; project: string }>> {
  const map = new Map();
  try {
    const res = await fetch('https://yields.llama.fi/pools', {
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return map;
    const data = await res.json();

    for (const pool of (data.data || []).slice(0, 500)) {
      map.set(pool.pool, {
        apy: pool.apy || 0,
        tvl: pool.tvlUsd || 0,
        project: pool.project || '',
      });
    }
  } catch { /* ignore */ }
  return map;
}

/* ── Fetch positions from Zapper-like public API ── */

async function fetchPositionsForAddress(
  address: string,
  chains: string[],
): Promise<DefiPosition[]> {
  const positions: DefiPosition[] = [];

  // Use DeFi Llama to get protocol TVL context
  const yieldPools = await fetchYieldPools();

  // For EVM addresses: check common protocols via their subgraph/API endpoints
  for (const chain of chains) {
    // Aave V3 positions (Ethereum, Arbitrum, Optimism, Polygon, Base)
    const aavePositions = await fetchAavePositions(address, chain);
    positions.push(...aavePositions);

    // Uniswap V3 LP positions
    const uniPositions = await fetchUniswapPositions(address, chain);
    positions.push(...uniPositions);

    // Lido staking (Ethereum)
    if (chain === 'ethereum') {
      const lidoPositions = await fetchLidoPositions(address);
      positions.push(...lidoPositions);
    }
  }

  // Enrich with yield data
  for (const pos of positions) {
    const poolKey = `${pos.protocol}-${pos.chain}`;
    for (const [, pool] of yieldPools) {
      if (pool.project.toLowerCase() === pos.protocol.toLowerCase()) {
        pos.apy = pool.apy;
        break;
      }
    }
  }

  return positions;
}

/* ── Aave V3 via subgraph ── */

async function fetchAavePositions(address: string, chain: string): Promise<DefiPosition[]> {
  const subgraphs: Record<string, string> = {
    ethereum: 'https://api.thegraph.com/subgraphs/name/aave/protocol-v3',
    arbitrum: 'https://api.thegraph.com/subgraphs/name/aave/protocol-v3-arbitrum',
    optimism: 'https://api.thegraph.com/subgraphs/name/aave/protocol-v3-optimism',
    polygon: 'https://api.thegraph.com/subgraphs/name/aave/protocol-v3-polygon',
  };

  const url = subgraphs[chain];
  if (!url) return [];

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `{
          userReserves(where: { user: "${address.toLowerCase()}" }) {
            currentATokenBalance
            currentVariableDebt
            reserve {
              symbol
              name
              decimals
              price { priceInEth }
            }
          }
        }`,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return [];
    const data = await res.json();
    const reserves = data?.data?.userReserves || [];
    const positions: DefiPosition[] = [];

    for (const r of reserves) {
      const balance = parseFloat(r.currentATokenBalance) / Math.pow(10, r.reserve.decimals);
      const debt = parseFloat(r.currentVariableDebt) / Math.pow(10, r.reserve.decimals);

      if (balance > 0.001) {
        positions.push({
          protocol: 'Aave V3',
          chain,
          type: 'lending',
          tokens: [{ symbol: r.reserve.symbol, amount: balance, usdValue: 0 }],
          totalUsdValue: 0,
        });
      }

      if (debt > 0.001) {
        positions.push({
          protocol: 'Aave V3',
          chain,
          type: 'lending',
          tokens: [{ symbol: `${r.reserve.symbol} (debt)`, amount: -debt, usdValue: 0 }],
          totalUsdValue: 0,
        });
      }
    }

    return positions;
  } catch {
    return [];
  }
}

/* ── Uniswap V3 LP via subgraph ── */

async function fetchUniswapPositions(address: string, chain: string): Promise<DefiPosition[]> {
  const subgraphs: Record<string, string> = {
    ethereum: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3',
    arbitrum: 'https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v3-arbitrum',
    optimism: 'https://api.thegraph.com/subgraphs/name/ianlapham/optimism-post-regenesis',
    polygon: 'https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v3-polygon',
    base: 'https://api.thegraph.com/subgraphs/name/lynnshaoyu/uniswap-v3-base',
  };

  const url = subgraphs[chain];
  if (!url) return [];

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `{
          positions(where: { owner: "${address.toLowerCase()}", liquidity_gt: "0" }, first: 20) {
            id
            liquidity
            token0 { symbol name decimals }
            token1 { symbol name decimals }
            depositedToken0
            depositedToken1
            pool { feeTier }
          }
        }`,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return [];
    const data = await res.json();
    const lps = data?.data?.positions || [];

    return lps.map((lp: Record<string, any>) => ({
      protocol: 'Uniswap V3',
      chain,
      type: 'liquidity' as const,
      tokens: [
        {
          symbol: lp.token0.symbol,
          amount: parseFloat(lp.depositedToken0),
          usdValue: 0,
        },
        {
          symbol: lp.token1.symbol,
          amount: parseFloat(lp.depositedToken1),
          usdValue: 0,
        },
      ],
      totalUsdValue: 0,
      apy: undefined,
    }));
  } catch {
    return [];
  }
}

/* ── Lido stETH ── */

async function fetchLidoPositions(address: string): Promise<DefiPosition[]> {
  const STETH = '0xae7ab96520de3a18e5e111b5eaab095312d7fe84';

  try {
    const res = await fetch(
      `https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=${STETH}&address=${address}&tag=latest&apikey=${process.env.ETHERSCAN_API_KEY || ''}`,
      { signal: AbortSignal.timeout(10000) },
    );

    const data = await res.json();
    const balance = parseFloat(data.result || '0') / 1e18;

    if (balance > 0.001) {
      return [
        {
          protocol: 'Lido',
          chain: 'ethereum',
          type: 'staking',
          tokens: [{ symbol: 'stETH', amount: balance, usdValue: 0 }],
          totalUsdValue: 0,
          apy: 3.5, // Approximate Lido staking APY
        },
      ];
    }
  } catch { /* ignore */ }

  return [];
}

/* ── Route Handler ── */

export async function GET(request: NextRequest) {
  try {
    const address = request.nextUrl.searchParams.get('address');
    if (!address) {
      return NextResponse.json({ error: 'address parameter is required' }, { status: 400 });
    }

    const chainsParam = request.nextUrl.searchParams.get('chains') || 'ethereum';
    const chains = chainsParam.split(',').map((c) => c.trim());

    const positions = await fetchPositionsForAddress(address, chains);

    const totalValue = positions.reduce((s, p) => s + p.totalUsdValue, 0);

    const summary: PositionSummary = {
      address,
      chains,
      totalValue,
      positions,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(summary);
  } catch (err) {
    console.error('[DeFi Positions] Error:', err);
    const message = err instanceof Error ? err.message : 'DeFi API error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
