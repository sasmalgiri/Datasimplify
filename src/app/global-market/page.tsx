import { notFound } from 'next/navigation';

// This page requires CoinGecko premium API (global-history endpoint) which is not available
// Returning 404 to prevent broken page experience
export default function GlobalMarketPage() {
  notFound();
}
