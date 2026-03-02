'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Binance WebSocket Mini-Ticker for real-time price updates.
 *
 * Uses Binance's public WebSocket (no API key needed).
 * Streams miniTicker events for selected symbols.
 *
 * Usage:
 *   const { prices, connected } = useWebSocketPrices(['btcusdt', 'ethusdt']);
 *   // prices = { btcusdt: { price: 60000, change24h: 2.5 }, ... }
 */

export interface WsTickerData {
  symbol: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  lastUpdate: number;
}

interface UseWebSocketPricesOptions {
  /** Whether to actually connect (default true) */
  enabled?: boolean;
  /** Max reconnect attempts (default 5) */
  maxReconnects?: number;
}

export function useWebSocketPrices(
  symbols: string[],
  options: UseWebSocketPricesOptions = {}
) {
  const { enabled = true, maxReconnects = 5 } = options;
  const [prices, setPrices] = useState<Record<string, WsTickerData>>({});
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCount = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const cleanup = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = undefined;
    }
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.onmessage = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnected(false);
  }, []);

  const connect = useCallback(() => {
    if (!enabled || symbols.length === 0) return;

    cleanup();

    // Build stream list — Binance uses lowercase symbols + @miniTicker
    const streams = symbols
      .map(s => `${s.toLowerCase()}@miniTicker`)
      .join('/');

    const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        setError(null);
        reconnectCount.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const d = msg.data;
          if (!d || !d.s) return;

          const ticker: WsTickerData = {
            symbol: d.s.toLowerCase(),
            price: parseFloat(d.c),         // Close price
            change24h: parseFloat(d.p) !== 0
              ? ((parseFloat(d.c) - parseFloat(d.o)) / parseFloat(d.o) * 100)
              : 0,
            high24h: parseFloat(d.h),
            low24h: parseFloat(d.l),
            volume24h: parseFloat(d.v),
            lastUpdate: Date.now(),
          };

          setPrices(prev => ({
            ...prev,
            [ticker.symbol]: ticker,
          }));
        } catch {
          // Ignore parse errors
        }
      };

      ws.onerror = () => {
        setError('WebSocket connection error');
      };

      ws.onclose = () => {
        setConnected(false);
        // Auto-reconnect with exponential backoff
        if (reconnectCount.current < maxReconnects) {
          const delay = Math.min(1000 * Math.pow(2, reconnectCount.current), 30000);
          reconnectCount.current++;
          reconnectTimer.current = setTimeout(connect, delay);
        }
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
    }
  }, [enabled, symbols, maxReconnects, cleanup]);

  useEffect(() => {
    connect();
    return cleanup;
  }, [connect, cleanup]);

  return { prices, connected, error };
}

/**
 * Hook for single-symbol trade stream (sub-second updates).
 *
 * Usage:
 *   const { trades, connected } = useWebSocketTrades('btcusdt');
 */
export interface WsTradeData {
  price: number;
  quantity: number;
  time: number;
  isBuyerMaker: boolean;
}

export function useWebSocketTrades(symbol: string, maxTrades = 50) {
  const [trades, setTrades] = useState<WsTradeData[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!symbol) return;

    const url = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@trade`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);

    ws.onmessage = (event) => {
      try {
        const d = JSON.parse(event.data);
        const trade: WsTradeData = {
          price: parseFloat(d.p),
          quantity: parseFloat(d.q),
          time: d.T,
          isBuyerMaker: d.m,
        };
        setTrades(prev => [trade, ...prev].slice(0, maxTrades));
      } catch {
        // Ignore
      }
    };

    ws.onclose = () => setConnected(false);

    return () => {
      ws.onclose = null;
      ws.close();
    };
  }, [symbol, maxTrades]);

  return { trades, connected };
}

/**
 * Hook for real-time orderbook depth (top N levels).
 *
 * Usage:
 *   const { bids, asks, connected } = useWebSocketDepth('btcusdt', 20);
 */
export interface DepthLevel {
  price: number;
  quantity: number;
  total: number;
}

export function useWebSocketDepth(symbol: string, levels: 5 | 10 | 20 = 20) {
  const [bids, setBids] = useState<DepthLevel[]>([]);
  const [asks, setAsks] = useState<DepthLevel[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!symbol) return;

    const url = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@depth${levels}@1000ms`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);

    ws.onmessage = (event) => {
      try {
        const d = JSON.parse(event.data);

        const parseLevels = (data: [string, string][]): DepthLevel[] => {
          let running = 0;
          return data.map(([p, q]) => {
            const price = parseFloat(p);
            const quantity = parseFloat(q);
            running += quantity;
            return { price, quantity, total: running };
          });
        };

        if (d.bids) setBids(parseLevels(d.bids));
        if (d.asks) setAsks(parseLevels(d.asks));
      } catch {
        // Ignore
      }
    };

    ws.onclose = () => setConnected(false);

    return () => {
      ws.onclose = null;
      ws.close();
    };
  }, [symbol, levels]);

  return { bids, asks, connected };
}
