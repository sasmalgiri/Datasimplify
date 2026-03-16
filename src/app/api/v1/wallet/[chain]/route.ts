/**
 * Multi-Chain Wallet Balance Endpoint
 *
 * GET /api/v1/wallet/:chain?address=0x...
 *
 * Supported chains: ethereum, bsc, polygon, arbitrum, optimism, base, solana, cosmos
 * Uses free explorer APIs — no user API key required for basic balance queries.
 */

import { NextRequest, NextResponse } from 'next/server';

interface TokenBalance {
  symbol: string;
  name: string;
  balance: number;
  decimals: number;
  contractAddress?: string;
  usdValue?: number;
}

interface WalletResult {
  chain: string;
  address: string;
  nativeBalance: number;
  nativeSymbol: string;
  tokens: TokenBalance[];
}

/* ── EVM chains via block explorer APIs ── */

const EVM_EXPLORERS: Record<string, { url: string; apiKey: string; symbol: string; name: string }> = {
  ethereum: {
    url: 'https://api.etherscan.io/api',
    apiKey: process.env.ETHERSCAN_API_KEY || '',
    symbol: 'ETH',
    name: 'Ethereum',
  },
  bsc: {
    url: 'https://api.bscscan.com/api',
    apiKey: process.env.BSCSCAN_API_KEY || '',
    symbol: 'BNB',
    name: 'BNB Chain',
  },
  polygon: {
    url: 'https://api.polygonscan.com/api',
    apiKey: process.env.POLYGONSCAN_API_KEY || '',
    symbol: 'MATIC',
    name: 'Polygon',
  },
  arbitrum: {
    url: 'https://api.arbiscan.io/api',
    apiKey: process.env.ARBISCAN_API_KEY || '',
    symbol: 'ETH',
    name: 'Arbitrum',
  },
  optimism: {
    url: 'https://api-optimistic.etherscan.io/api',
    apiKey: process.env.OPTIMISM_API_KEY || '',
    symbol: 'ETH',
    name: 'Optimism',
  },
  base: {
    url: 'https://api.basescan.org/api',
    apiKey: process.env.BASESCAN_API_KEY || '',
    symbol: 'ETH',
    name: 'Base',
  },
};

async function fetchEvmBalance(
  chain: string,
  address: string,
): Promise<WalletResult> {
  const explorer = EVM_EXPLORERS[chain];
  if (!explorer) throw new Error(`Unknown EVM chain: ${chain}`);

  // Fetch native balance
  const balUrl = `${explorer.url}?module=account&action=balance&address=${address}&tag=latest&apikey=${explorer.apiKey}`;
  const balRes = await fetch(balUrl, { signal: AbortSignal.timeout(10000) });
  const balData = await balRes.json();

  const nativeBalance =
    balData.status === '1' ? parseFloat(balData.result) / 1e18 : 0;

  // Fetch ERC-20 token balances
  const tokUrl = `${explorer.url}?module=account&action=tokentx&address=${address}&page=1&offset=50&sort=desc&apikey=${explorer.apiKey}`;
  const tokRes = await fetch(tokUrl, { signal: AbortSignal.timeout(10000) });
  const tokData = await tokRes.json();

  const tokenMap = new Map<string, TokenBalance>();

  if (tokData.status === '1' && Array.isArray(tokData.result)) {
    for (const tx of tokData.result) {
      const contractAddress = tx.contractAddress;
      if (tokenMap.has(contractAddress)) continue;

      const decimals = parseInt(tx.tokenDecimal) || 18;
      // Get current balance for this token
      const tbUrl = `${explorer.url}?module=account&action=tokenbalance&contractaddress=${contractAddress}&address=${address}&tag=latest&apikey=${explorer.apiKey}`;
      const tbRes = await fetch(tbUrl, { signal: AbortSignal.timeout(5000) }).catch(() => null);

      if (tbRes?.ok) {
        const tbData = await tbRes.json();
        const rawBalance = parseFloat(tbData.result || '0');
        const balance = rawBalance / Math.pow(10, decimals);

        if (balance > 0) {
          tokenMap.set(contractAddress, {
            symbol: tx.tokenSymbol,
            name: tx.tokenName,
            balance,
            decimals,
            contractAddress,
          });
        }
      }

      // Limit to 10 token balance lookups to avoid rate limits
      if (tokenMap.size >= 10) break;
    }
  }

  return {
    chain: explorer.name,
    address,
    nativeBalance,
    nativeSymbol: explorer.symbol,
    tokens: Array.from(tokenMap.values()),
  };
}

/* ── Solana via public RPC ── */

async function fetchSolanaBalance(address: string): Promise<WalletResult> {
  const rpc = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

  // Get SOL balance
  const balRes = await fetch(rpc, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getBalance',
      params: [address],
    }),
    signal: AbortSignal.timeout(10000),
  });

  const balData = await balRes.json();
  const lamports = balData.result?.value || 0;
  const solBalance = lamports / 1e9;

  // Get SPL token accounts
  const tokRes = await fetch(rpc, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'getTokenAccountsByOwner',
      params: [
        address,
        { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
        { encoding: 'jsonParsed' },
      ],
    }),
    signal: AbortSignal.timeout(10000),
  });

  const tokData = await tokRes.json();
  const tokens: TokenBalance[] = [];

  if (tokData.result?.value) {
    for (const account of tokData.result.value) {
      const info = account.account?.data?.parsed?.info;
      if (!info) continue;

      const amount = parseFloat(info.tokenAmount?.uiAmountString || '0');
      if (amount <= 0) continue;

      tokens.push({
        symbol: info.mint?.slice(0, 6) || 'SPL',
        name: 'SPL Token',
        balance: amount,
        decimals: info.tokenAmount?.decimals || 9,
        contractAddress: info.mint,
      });
    }
  }

  return {
    chain: 'Solana',
    address,
    nativeBalance: solBalance,
    nativeSymbol: 'SOL',
    tokens: tokens.slice(0, 20),
  };
}

/* ── Cosmos via REST API ── */

async function fetchCosmosBalance(address: string): Promise<WalletResult> {
  const api = 'https://rest.cosmos.directory/cosmoshub';

  const res = await fetch(`${api}/cosmos/bank/v1beta1/balances/${address}`, {
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) throw new Error(`Cosmos API error: ${res.status}`);
  const data = await res.json();

  let nativeBalance = 0;
  const tokens: TokenBalance[] = [];

  for (const bal of data.balances || []) {
    const amount = parseFloat(bal.amount) / 1e6; // uatom -> ATOM
    if (bal.denom === 'uatom') {
      nativeBalance = amount;
    } else {
      tokens.push({
        symbol: bal.denom,
        name: bal.denom,
        balance: amount,
        decimals: 6,
      });
    }
  }

  return {
    chain: 'Cosmos Hub',
    address,
    nativeBalance,
    nativeSymbol: 'ATOM',
    tokens,
  };
}

/* ── Route Handler ── */

const SUPPORTED_CHAINS = [
  'ethereum', 'bsc', 'polygon', 'arbitrum', 'optimism', 'base', 'solana', 'cosmos',
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chain: string }> },
) {
  try {
    const { chain } = await params;
    const address = request.nextUrl.searchParams.get('address');

    if (!address) {
      return NextResponse.json({ error: 'address parameter is required' }, { status: 400 });
    }

    if (!SUPPORTED_CHAINS.includes(chain)) {
      return NextResponse.json(
        { error: `Unsupported chain. Supported: ${SUPPORTED_CHAINS.join(', ')}` },
        { status: 400 },
      );
    }

    let result: WalletResult;

    if (chain === 'solana') {
      result = await fetchSolanaBalance(address);
    } else if (chain === 'cosmos') {
      result = await fetchCosmosBalance(address);
    } else {
      result = await fetchEvmBalance(chain, address);
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('[Wallet Balance] Error:', err);
    const message = err instanceof Error ? err.message : 'Wallet API error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
