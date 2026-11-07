export interface SentryConfig {
  dsn?: string;
  environment?: string;
  enabled?: boolean;
}

export function initMonitoring(config: SentryConfig = {}): void {
  if (!config.enabled || !config.dsn) {
    return;
  }
  // Hook for Sentry SDK initialization when DSN is supplied
}

export function captureException(error: unknown, context?: Record<string, unknown>): void {
  // Capture exception hook
  if (process.env.NODE_ENV !== "production") {
    console.error("[NXTQR Monitoring Exception]", error, context);
  }
}
