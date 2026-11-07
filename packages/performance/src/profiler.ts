export interface PerformanceMark {
  name: string;
  durationMs: number;
  timestamp: number;
}

function now(): number {
  const g = globalThis as unknown as { performance?: { now?: () => number } };
  if (g.performance && typeof g.performance.now === "function") {
    return g.performance.now();
  }
  return Date.now();
}

export function measureExecutionTime<T>(
  name: string,
  fn: () => T,
): { result: T; mark: PerformanceMark } {
  const start = now();
  const result = fn();
  const durationMs = now() - start;

  return {
    result,
    mark: {
      name,
      durationMs,
      timestamp: Date.now(),
    },
  };
}

export async function measureAsyncExecutionTime<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<{ result: T; mark: PerformanceMark }> {
  const start = now();
  const result = await fn();
  const durationMs = now() - start;

  return {
    result,
    mark: {
      name,
      durationMs,
      timestamp: Date.now(),
    },
  };
}
