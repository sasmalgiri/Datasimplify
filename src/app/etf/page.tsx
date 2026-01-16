import { notFound } from 'next/navigation';

// ETF flow/AUM data is not available from free public APIs
// This page only showed BTC price context, not actual ETF data
// Returning 404 to prevent misleading users
export default function ETFPage() {
  notFound();
}
