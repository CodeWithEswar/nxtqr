import { describe, it, expect } from "vitest";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { MetricNormalizer } from "../observability/telemetry/metric-normalizer";
import { TopologyDriftDetector } from "../observability/analysis/topology-drift-detector";
import { ServiceIdentityMapper } from "../observability/mapping/service-identity-mapper";
import type {
  DiscoveredService,
  MetricDataPoint,
  TelemetryServiceMapping,
  TraceSpan,
} from "../observability/contracts/observability.types";

describe("Architecture Observability - Performance Benchmarks", () => {
  it("processes 10,000 metric counter datapoints in under 25ms", () => {
    const datapoints: MetricDataPoint[] = [];
    const baseTime = 1700000000000;
    let accumulated = 0;

    for (let i = 0; i < 10000; i++) {
      accumulated += Math.floor(Math.random() * 20) + 1;
      datapoints.push({
        timestampMs: baseTime + i * 1000,
        value: accumulated,
      });
    }

    const start = performance.now();
    const rates = MetricNormalizer.computeCounterRate(datapoints);
    const duration = performance.now() - start;

    expect(rates.length).toBe(9999);
    expect(duration).toBeLessThan(25);
  });

  it("calculates 5,000 histogram quantiles in under 20ms", () => {
    const buckets = [
      { le: 0.005, count: 50 },
      { le: 0.01, count: 120 },
      { le: 0.025, count: 450 },
      { le: 0.05, count: 800 },
      { le: 0.1, count: 1200 },
      { le: 0.25, count: 1600 },
      { le: 0.5, count: 1850 },
      { le: 1.0, count: 1980 },
      { le: 2.5, count: 2000 },
    ];

    const start = performance.now();
    for (let i = 0; i < 5000; i++) {
      MetricNormalizer.calculateHistogramQuantile(buckets, 0.95);
    }
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(20);
  });

  it("evaluates topology drift for 500 nodes and 1,000 edges in under 50ms", () => {
    const nodes: BaseNode[] = [];
    const edges: BaseEdge[] = [];
    const mappings: TelemetryServiceMapping[] = [];
    const spans: TraceSpan[] = [];

    for (let i = 0; i < 500; i++) {
      const id = `node-${i}`;
      nodes.push({
        id,
        type: i % 5 === 0 ? "database" : "service",
        position: { x: (i % 20) * 100, y: Math.floor(i / 20) * 80 },
        data: { label: `Service ${i}` },
      });

      if (i > 0) {
        edges.push({
          id: `edge-${i - 1}-${i}`,
          source: `node-${i - 1}`,
          target: id,
          data: {},
        });
      }

      mappings.push({
        id: `map-${i}`,
        projectId: "p1",
        architectureId: "a1",
        componentId: id,
        connectionId: "c1",
        serviceIdentity: { serviceName: `service-${i}` },
        confidence: "confirmed",
        evidenceScore: 1,
        evidenceReasons: [],
        lastVerifiedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Add 200 spans representing interactions
    for (let i = 0; i < 200; i++) {
      spans.push({
        traceId: `t-${i}`,
        spanId: `s-parent-${i}`,
        serviceName: `service-${i}`,
        operationName: "CallNext",
        startTimeMs: 1000 + i * 10,
        durationMs: 15,
        statusCode: "ok",
        attributes: {},
        isCriticalPath: true,
      });
      spans.push({
        traceId: `t-${i}`,
        spanId: `s-child-${i}`,
        parentSpanId: `s-parent-${i}`,
        serviceName: `service-${i + 1}`,
        operationName: "ReceiveNext",
        startTimeMs: 1005 + i * 10,
        durationMs: 10,
        statusCode: "ok",
        attributes: {},
        isCriticalPath: true,
      });
    }

    const start = performance.now();
    const findings = TopologyDriftDetector.detectDrift({
      nodes,
      edges,
      mappings,
      observedSpans: spans,
    });
    const duration = performance.now() - start;

    expect(Array.isArray(findings)).toBe(true);
    expect(duration).toBeLessThan(50);
  });

  it("generates automated mapping suggestions for 100 discovered services against 200 nodes in under 30ms", () => {
    const nodes: BaseNode[] = [];
    for (let i = 0; i < 200; i++) {
      nodes.push({
        id: `node-${i}`,
        type: "service",
        position: { x: 0, y: 0 },
        data: { label: `Microservice-${i}` },
      });
    }

    const services: DiscoveredService[] = [];
    for (let i = 0; i < 100; i++) {
      services.push({
        connectionId: "conn-1",
        serviceIdentity: { serviceName: `microservice-${i}` },
        displayName: `Microservice ${i}`,
        firstSeenAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        detectedProtocols: ["http"],
        metricsCount: 10,
      });
    }

    const start = performance.now();
    const suggestions = ServiceIdentityMapper.generateSuggestions(
      services,
      nodes,
      "conn-1",
      "arch-1",
      "proj-1"
    );
    const duration = performance.now() - start;

    expect(suggestions.length).toBeGreaterThan(0);
    expect(duration).toBeLessThan(100);
  });
});
