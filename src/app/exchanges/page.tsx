import { notFound } from 'next/navigation';

// This page requires CoinGecko premium API access which is not available
// Returning 404 to prevent broken page experience
export default function ExchangesPage() {
  notFound();
}
