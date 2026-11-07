export interface RateLimiterOptions {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

export class InMemoryRateLimiter {
  private hits = new Map<string, { count: number; resetAt: number }>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(options: RateLimiterOptions) {
    this.maxRequests = options.maxRequests;
    this.windowMs = options.windowMs;
  }

  public check(key: string): RateLimitResult {
    const now = Date.now();
    const entry = this.hits.get(key);

    if (!entry || entry.resetAt <= now) {
      this.hits.set(key, { count: 1, resetAt: now + this.windowMs });
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetMs: this.windowMs,
      };
    }

    if (entry.count >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetMs: Math.max(0, entry.resetAt - now),
      };
    }

    entry.count += 1;
    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
      resetMs: Math.max(0, entry.resetAt - now),
    };
  }

  public reset(key: string): void {
    this.hits.delete(key);
  }
}
