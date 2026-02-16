// Tax calculation engine for CryptoReportKit
// Supports FIFO, LIFO, and Average cost basis methods
// Generates IRS Form 8949-compatible CSV exports

/* ─── Interfaces ─── */

export interface TaxTrade {
  id: string;
  coinId: string;
  coinName: string;
  type: 'buy' | 'sell';
  date: string; // ISO date
  quantity: number;
  pricePerUnit: number;
  totalValue: number;
}

export type CostBasisMethod = 'fifo' | 'lifo' | 'avg';

export interface TaxLot {
  date: string;
  quantity: number;
  pricePerUnit: number;
  remaining: number;
}

export interface RealizedGain {
  sellDate: string;
  coinId: string;
  coinName: string;
  quantity: number;
  proceeds: number;
  costBasis: number;
  gain: number;
  isLongTerm: boolean; // held > 365 days
}

export interface TaxSummary {
  totalProceeds: number;
  totalCostBasis: number;
  totalGain: number;
  shortTermGain: number;
  longTermGain: number;
  realizedGains: RealizedGain[];
}

/* ─── Helpers ─── */

const MS_PER_DAY = 86_400_000;
const LONG_TERM_DAYS = 365;

/** Returns true if the holding period exceeds 365 days */
function isLongTermHolding(buyDate: string, sellDate: string): boolean {
  const diffMs = new Date(sellDate).getTime() - new Date(buyDate).getTime();
  return diffMs > LONG_TERM_DAYS * MS_PER_DAY;
}

/** Group trades by coinId */
function groupByCoin(trades: TaxTrade[]): Map<string, TaxTrade[]> {
  const map = new Map<string, TaxTrade[]>();
  for (const t of trades) {
    const group = map.get(t.coinId) ?? [];
    group.push(t);
    map.set(t.coinId, group);
  }
  return map;
}

/* ─── Cost Basis Calculation ─── */

function processGainsForCoin(
  coinTrades: TaxTrade[],
  method: CostBasisMethod,
): RealizedGain[] {
  // Separate buys and sells, sorted by date
  const buys = coinTrades
    .filter((t) => t.type === 'buy')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const sells = coinTrades
    .filter((t) => t.type === 'sell')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Build tax lots from buy trades
  const lots: TaxLot[] = buys.map((b) => ({
    date: b.date,
    quantity: b.quantity,
    pricePerUnit: b.pricePerUnit,
    remaining: b.quantity,
  }));

  const gains: RealizedGain[] = [];

  for (const sell of sells) {
    let remaining = sell.quantity;
    let totalCostBasis = 0;
    const proceeds = sell.quantity * sell.pricePerUnit;

    // Determine lot consumption order based on method
    if (method === 'avg') {
      // Average cost basis: compute weighted average of ALL remaining lots
      const totalRemaining = lots.reduce((sum, l) => sum + l.remaining, 0);
      const totalCost = lots.reduce((sum, l) => sum + l.remaining * l.pricePerUnit, 0);
      const avgPrice = totalRemaining > 0 ? totalCost / totalRemaining : 0;

      // Compute a weighted average acquisition date for long-term determination
      const totalRemainingMs = lots.reduce(
        (sum, l) => sum + l.remaining * new Date(l.date).getTime(),
        0,
      );
      const avgDateMs = totalRemaining > 0 ? totalRemainingMs / totalRemaining : Date.now();
      const avgDate = new Date(avgDateMs).toISOString().split('T')[0];

      // Consume from lots proportionally (or just deplete from earliest for tracking)
      let qtyToDeduct = remaining;
      for (const lot of lots) {
        if (qtyToDeduct <= 0) break;
        const deducted = Math.min(lot.remaining, qtyToDeduct);
        lot.remaining -= deducted;
        qtyToDeduct -= deducted;
      }

      totalCostBasis = remaining * avgPrice;

      gains.push({
        sellDate: sell.date,
        coinId: sell.coinId,
        coinName: sell.coinName,
        quantity: sell.quantity,
        proceeds,
        costBasis: totalCostBasis,
        gain: proceeds - totalCostBasis,
        isLongTerm: isLongTermHolding(avgDate, sell.date),
      });
    } else {
      // FIFO or LIFO — consume specific lots
      const orderedLots =
        method === 'lifo'
          ? [...lots].filter((l) => l.remaining > 0).reverse()
          : lots.filter((l) => l.remaining > 0);

      // Track per-lot portions for accurate long-term/short-term split
      const portions: { lotDate: string; qty: number; cost: number }[] = [];

      for (const lot of orderedLots) {
        if (remaining <= 0) break;
        if (lot.remaining <= 0) continue;

        const consumed = Math.min(lot.remaining, remaining);
        lot.remaining -= consumed;
        remaining -= consumed;
        totalCostBasis += consumed * lot.pricePerUnit;

        portions.push({
          lotDate: lot.date,
          qty: consumed,
          cost: consumed * lot.pricePerUnit,
        });
      }

      // Generate one gain entry per lot portion for accurate long/short classification
      for (const portion of portions) {
        const portionProceeds = (portion.qty / sell.quantity) * proceeds;
        const portionGain = portionProceeds - portion.cost;

        gains.push({
          sellDate: sell.date,
          coinId: sell.coinId,
          coinName: sell.coinName,
          quantity: portion.qty,
          proceeds: portionProceeds,
          costBasis: portion.cost,
          gain: portionGain,
          isLongTerm: isLongTermHolding(portion.lotDate, sell.date),
        });
      }
    }
  }

  return gains;
}

/* ─── Public API ─── */

/**
 * Calculate a full tax summary from a list of trades using the given cost basis method.
 */
export function calculateTaxSummary(
  trades: TaxTrade[],
  method: CostBasisMethod,
): TaxSummary {
  const grouped = groupByCoin(trades);
  const allGains: RealizedGain[] = [];

  for (const [, coinTrades] of grouped) {
    const gains = processGainsForCoin(coinTrades, method);
    allGains.push(...gains);
  }

  // Sort realized gains by sell date
  allGains.sort((a, b) => new Date(a.sellDate).getTime() - new Date(b.sellDate).getTime());

  const totalProceeds = allGains.reduce((s, g) => s + g.proceeds, 0);
  const totalCostBasis = allGains.reduce((s, g) => s + g.costBasis, 0);
  const totalGain = allGains.reduce((s, g) => s + g.gain, 0);
  const shortTermGain = allGains
    .filter((g) => !g.isLongTerm)
    .reduce((s, g) => s + g.gain, 0);
  const longTermGain = allGains
    .filter((g) => g.isLongTerm)
    .reduce((s, g) => s + g.gain, 0);

  return {
    totalProceeds,
    totalCostBasis,
    totalGain,
    shortTermGain,
    longTermGain,
    realizedGains: allGains,
  };
}

/**
 * Generate a CSV string matching IRS Form 8949 format.
 * Columns: Description of Property, Date Acquired, Date Sold, Proceeds, Cost Basis, Gain or Loss
 */
export function generateForm8949CSV(summary: TaxSummary): string {
  const header =
    'Description of Property,Date Acquired,Date Sold,Proceeds,Cost Basis,Gain or Loss,Term';
  const rows = summary.realizedGains.map((g) => {
    const description = `${g.quantity} ${g.coinName} (${g.coinId})`;
    // We don't have the exact buy date in a single field for AVG method — use sellDate context
    // For FIFO/LIFO the gain entries map to individual lot dates; for AVG we derive it
    const dateAcquired = 'Various';
    const dateSold = formatCSVDate(g.sellDate);
    const proceeds = g.proceeds.toFixed(2);
    const costBasis = g.costBasis.toFixed(2);
    const gainLoss = g.gain.toFixed(2);
    const term = g.isLongTerm ? 'Long-term' : 'Short-term';

    return [description, dateAcquired, dateSold, proceeds, costBasis, gainLoss, term]
      .map(escapeCSV)
      .join(',');
  });

  // Summary row
  rows.push('');
  rows.push(
    [
      'TOTALS',
      '',
      '',
      summary.totalProceeds.toFixed(2),
      summary.totalCostBasis.toFixed(2),
      summary.totalGain.toFixed(2),
      '',
    ]
      .map(escapeCSV)
      .join(','),
  );
  rows.push(
    ['Short-term total', '', '', '', '', summary.shortTermGain.toFixed(2), 'Short-term']
      .map(escapeCSV)
      .join(','),
  );
  rows.push(
    ['Long-term total', '', '', '', '', summary.longTermGain.toFixed(2), 'Long-term']
      .map(escapeCSV)
      .join(','),
  );

  return [header, ...rows].join('\n');
}

/**
 * Trigger a browser download of the given CSV string.
 */
export function downloadCSV(csv: string, filename: string): void {
  if (typeof window === 'undefined') return;

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

/* ─── CSV Helpers ─── */

function formatCSVDate(isoDate: string): string {
  const d = new Date(isoDate);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
