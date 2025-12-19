/**
 * Rate Limiter for External APIs
 * Prevents hitting API rate limits by queuing requests with delays
 */

interface QueuedRequest {
  url: string;
  options?: RequestInit;
  resolve: (response: Response) => void;
  reject: (error: Error) => void;
  retries: number;
}

interface RateLimiterConfig {
  requestsPerSecond: number;
  maxRetries: number;
  retryDelayMs: number;
}

// Rate limiter configurations for different APIs
const API_CONFIGS: Record<string, RateLimiterConfig> = {
  coingecko: {
    requestsPerSecond: 10, // Free tier: ~10-30 req/min, we'll be conservative
    maxRetries: 3,
    retryDelayMs: 1000
  },
  defillama: {
    requestsPerSecond: 50, // DefiLlama is generous
    maxRetries: 2,
    retryDelayMs: 500
  },
  binance: {
    requestsPerSecond: 20,
    maxRetries: 2,
    retryDelayMs: 500
  },
  default: {
    requestsPerSecond: 5,
    maxRetries: 3,
    retryDelayMs: 1000
  }
};

class RateLimiter {
  private queues: Map<string, QueuedRequest[]> = new Map();
  private processing: Map<string, boolean> = new Map();
  private lastRequestTime: Map<string, number> = new Map();

  private getConfig(apiName: string): RateLimiterConfig {
    return API_CONFIGS[apiName] || API_CONFIGS.default;
  }

  private getApiName(url: string): string {
    if (url.includes('coingecko.com')) return 'coingecko';
    if (url.includes('llama.fi')) return 'defillama';
    if (url.includes('binance.com')) return 'binance';
    return 'default';
  }

  async fetch(url: string, options?: RequestInit): Promise<Response> {
    const apiName = this.getApiName(url);

    return new Promise((resolve, reject) => {
      const request: QueuedRequest = { url, options, resolve, reject, retries: 0 };

      if (!this.queues.has(apiName)) {
        this.queues.set(apiName, []);
      }

      this.queues.get(apiName)!.push(request);
      this.processQueue(apiName);
    });
  }

  private async processQueue(apiName: string): Promise<void> {
    if (this.processing.get(apiName)) return;
    this.processing.set(apiName, true);

    const queue = this.queues.get(apiName);
    const config = this.getConfig(apiName);
    const minDelay = 1000 / config.requestsPerSecond;

    while (queue && queue.length > 0) {
      const request = queue.shift()!;

      // Ensure minimum delay between requests
      const lastTime = this.lastRequestTime.get(apiName) || 0;
      const elapsed = Date.now() - lastTime;
      if (elapsed < minDelay) {
        await this.delay(minDelay - elapsed);
      }

      try {
        this.lastRequestTime.set(apiName, Date.now());
        const response = await fetch(request.url, request.options);

        // Handle rate limiting (429)
        if (response.status === 429) {
          if (request.retries < config.maxRetries) {
            request.retries++;
            const backoffDelay = config.retryDelayMs * Math.pow(2, request.retries);
            console.warn(`Rate limited on ${apiName}, retrying in ${backoffDelay}ms (attempt ${request.retries})`);
            await this.delay(backoffDelay);
            queue.unshift(request); // Re-add to front of queue
            continue;
          } else {
            request.reject(new Error(`Rate limited after ${config.maxRetries} retries`));
            continue;
          }
        }

        request.resolve(response);
      } catch (error) {
        if (request.retries < config.maxRetries) {
          request.retries++;
          const backoffDelay = config.retryDelayMs * Math.pow(2, request.retries);
          console.warn(`Request failed on ${apiName}, retrying in ${backoffDelay}ms (attempt ${request.retries})`);
          await this.delay(backoffDelay);
          queue.unshift(request);
        } else {
          request.reject(error as Error);
        }
      }
    }

    this.processing.set(apiName, false);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get current queue status for debugging
  getStatus(): Record<string, { queueLength: number; isProcessing: boolean }> {
    const status: Record<string, { queueLength: number; isProcessing: boolean }> = {};
    for (const [apiName, queue] of this.queues) {
      status[apiName] = {
        queueLength: queue.length,
        isProcessing: this.processing.get(apiName) || false
      };
    }
    return status;
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

/**
 * Rate-limited fetch for CoinGecko
 * Use this instead of direct fetch for CoinGecko API calls
 */
export async function fetchWithRateLimit(url: string, options?: RequestInit): Promise<Response> {
  return rateLimiter.fetch(url, options);
}

/**
 * Batch multiple CoinGecko requests with rate limiting
 */
export async function batchFetch(
  urls: string[],
  options?: RequestInit
): Promise<PromiseSettledResult<Response>[]> {
  return Promise.allSettled(urls.map(url => rateLimiter.fetch(url, options)));
}
