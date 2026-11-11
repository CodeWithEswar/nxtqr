import { describe, it, expect } from 'vitest';
import { PerformanceBenchmarker } from '../readiness/benchmarks/performance-benchmarker';
import { PerformanceBenchmarkMetricsSchema } from '../readiness/schemas/readiness.schemas';

describe('Phase 05.3.30: Performance Benchmarker', () => {
  const benchmarker = new PerformanceBenchmarker();

  it('should run measured benchmarks and conform to benchmark schema', async () => {
    const metrics = await benchmarker.benchmarkWorkload({
      nodeCount: 10,
      edgeDensity: 1.2,
    });

    const parsed = PerformanceBenchmarkMetricsSchema.safeParse(metrics);
    expect(parsed.success).toBe(true);
  });

  it('should measure real non-zero execution durations and positive cache speedup', async () => {
    const metrics = await benchmarker.benchmarkWorkload({
      nodeCount: 8,
      edgeDensity: 1.2,
    });

    expect(metrics.graphLoadDurationMs).toBeGreaterThanOrEqual(0.01);
    expect(metrics.analysisWaveDurationMs).toBeGreaterThan(0);
    expect(metrics.cacheSpeedupRatio).toBeGreaterThanOrEqual(1.0);
    expect(metrics.memoryUsageEstimateMb).toBeGreaterThan(0);
    expect(metrics.reportGenerationDurationMs).toBeGreaterThan(0);
    expect(metrics.nodesEvaluated).toBe(8);
  });
});
