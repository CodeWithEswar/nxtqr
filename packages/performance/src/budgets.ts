export const PERFORMANCE_BUDGETS = {
  initialGzipBundleKb: 150,
  maxCanvasRenderDurationMs: 16.6, // 60fps frame budget
  maxLayoutCalculationDurationMs: 100, // Elk.js background layout budget
  maxApiLatencyMs: 300,
} as const;
