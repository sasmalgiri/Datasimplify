// components/PoweredByCoinGecko.tsx
export function PoweredByCoinGecko({ className = "" }: { className?: string }) {
  return (
    <div className={`text-[10px] leading-4 opacity-80 ${className}`}>
      Powered by{" "}
      <a
        href="https://www.coingecko.com/en/api"
        target="_blank"
        rel="noreferrer"
        className="underline"
      >
        CoinGecko API
      </a>
    </div>
  );
}