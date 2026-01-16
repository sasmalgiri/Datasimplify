import Link from 'next/link';

export default function ResearchPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Research Workspace</h1>
      <p className="mt-3 text-muted-foreground">
        A focused space for exploring datasets, comparing assets, and building a repeatable research flow.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-5">
          <h2 className="text-lg font-semibold">Core research tools</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link className="underline" href="/templates">
                Excel Downloads
              </Link>
              <span className="text-muted-foreground"> — powered by CryptoSheets for live data</span>
            </li>
            <li>
              <Link className="underline" href="/charts">
                Charts
              </Link>
              <span className="text-muted-foreground"> — explore time series and visual analysis</span>
            </li>
            <li>
              <Link className="underline" href="/compare">
                Comparisons
              </Link>
              <span className="text-muted-foreground"> — side-by-side metrics with explanations</span>
            </li>
          </ul>
        </div>

        <div className="rounded-lg border p-5">
          <h2 className="text-lg font-semibold">Analytics</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link className="underline" href="/market">
                Market analytics
              </Link>
              <span className="text-muted-foreground"> — rankings, movers, market stats</span>
            </li>
            <li>
              <Link className="underline" href="/onchain">
                On-chain analytics
              </Link>
              <span className="text-muted-foreground"> — network activity metrics (availability varies)</span>
            </li>
            <li>
              <Link className="underline" href="/technical">
                Technical metrics
              </Link>
              <span className="text-muted-foreground"> — educational indicators and levels</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
