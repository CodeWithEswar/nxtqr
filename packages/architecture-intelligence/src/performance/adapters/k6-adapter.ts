import type {
  BenchmarkDefinition,
  BenchmarkEnvironment,
  BenchmarkRun,
  OperationMetricSummary,
  WorkloadProfile,
} from "../contracts/performance.types";
import { WorkloadValidator } from "../planning/workload-validator";
import { ResultNormalizer } from "../results/result-normalizer";

export class K6Adapter {
  /**
   * Generates production-grade, executable k6 test script (ECMAScript)
   */
  public static exportScript(definition: BenchmarkDefinition): string {
    const normalizedOps = WorkloadValidator.normalizeOperationWeights(definition.operations);
    const profile = definition.workloadProfile;

    // Build k6 thresholds
    const thresholds: Record<string, string[]> = {};
    for (const target of definition.targets) {
      const opSymbol = target.operator === "lt" ? "<" : target.operator === "lte" ? "<=" : target.operator === "gt" ? ">" : ">=";
      if (target.metric.includes("latency")) {
        const pMatch = target.metric.match(/p(\d+)_latency/);
        if (pMatch) {
          const percentile = pMatch[1];
          thresholds["http_req_duration"] = thresholds["http_req_duration"] || [];
          thresholds["http_req_duration"].push(`p(${percentile})${opSymbol}${target.thresholdValue}`);
        } else if (target.metric === "max_latency") {
          thresholds["http_req_duration"] = thresholds["http_req_duration"] || [];
          thresholds["http_req_duration"].push(`max${opSymbol}${target.thresholdValue}`);
        }
      } else if (target.metric === "error_rate_pct") {
        // k6 tracks error rate from 0.0 to 1.0
        const rateFraction = target.thresholdValue / 100;
        thresholds["http_req_failed"] = thresholds["http_req_failed"] || [];
        thresholds["http_req_failed"].push(`rate${opSymbol}${rateFraction.toFixed(4)}`);
      } else if (target.metric === "throughput_rps") {
        thresholds["http_reqs"] = thresholds["http_reqs"] || [];
        thresholds["http_reqs"].push(`rate${opSymbol}${target.thresholdValue}`);
      }
    }

    // Default safety threshold if none defined
    if (!thresholds["http_req_failed"]) {
      thresholds["http_req_failed"] = ["rate<0.05"];
    }

    // Build Scenarios
    let scenarioConfig: string;
    let thinkTimeCode = "";

    if (profile.modelType === "closed_loop") {
      const stagesFormatted = profile.stages
        .map(
          (s) =>
            `      { duration: '${s.durationSeconds}s', target: ${s.targetVUs ?? profile.maxVUs} }, // ${s.name} (${s.stageType})`
        )
        .join("\n");

      scenarioConfig = `
    closed_loop_exec: {
      executor: 'ramping-vus',
      startVUs: ${profile.initialVUs},
      stages: [
${stagesFormatted}
      ],
      gracefulRampDown: '10s',
    },`;

      const minSleep = (profile.thinkTimeMs.min / 1000).toFixed(2);
      const maxSleep = (profile.thinkTimeMs.max / 1000).toFixed(2);
      thinkTimeCode = `
  // Simulated Closed-Loop Think Time (${profile.thinkTimeMs.min}ms - ${profile.thinkTimeMs.max}ms)
  const thinkTime = Math.random() * (${maxSleep} - ${minSleep}) + ${minSleep};
  sleep(thinkTime);`;
    } else {
      // Open loop
      const stagesFormatted = profile.stages
        .map(
          (s) =>
            `      { duration: '${s.durationSeconds}s', target: ${s.targetRps ?? profile.targetRps} }, // ${s.name} (${s.stageType})`
        )
        .join("\n");

      scenarioConfig = `
    open_loop_exec: {
      executor: 'ramping-arrival-rate',
      startRate: 1,
      timeUnit: '1s',
      preAllocatedVUs: ${profile.allocatedVUs},
      maxVUs: ${profile.maxExecutionCapacityVUs},
      stages: [
${stagesFormatted}
      ],
      gracefulStop: '10s',
    },`;
    }

    // Operations Selection & Code
    const operationsJson = JSON.stringify(
      normalizedOps.map((op) => ({
        id: op.id,
        name: op.name,
        method: op.method,
        path: op.path,
        weight: op.weight,
        expectedStatus: op.expectedStatus,
        componentId: op.targetComponentId || "unmapped",
        timeoutMs: op.timeoutMs || 10000,
      })),
      null,
      2
    );

    const script = `/**
 * ============================================================================
 * NXTQR Benchmark Test Plan: ${definition.name}
 * Test Type: ${definition.testType.toUpperCase()} | Model: ${profile.modelType.toUpperCase()}
 * Target Host: ${definition.targetHost}
 * Generated: ${new Date().toISOString()}
 * ============================================================================
 * Execution Note: Run with k6 run --summary-export=summary.json test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  discardResponseBodies: false,
  scenarios: {${scenarioConfig}
  },
  thresholds: ${JSON.stringify(thresholds, null, 4)},
};

const BASE_URL = '${definition.targetHost.replace(/\/$/, "")}';

const OPERATIONS = ${operationsJson};

function selectOperation() {
  const rand = Math.random() * 100;
  let cumulative = 0;
  for (const op of OPERATIONS) {
    cumulative += op.weight;
    if (rand <= cumulative) {
      return op;
    }
  }
  return OPERATIONS[OPERATIONS.length - 1];
}

export default function () {
  const op = selectOperation();
  const url = BASE_URL + op.path;
  const params = {
    timeout: op.timeoutMs + 'ms',
    tags: {
      name: op.name,
      operation_id: op.id,
      component: op.componentId,
    },
  };

  let res;
  if (op.method === 'GET') {
    res = http.get(url, params);
  } else if (op.method === 'POST') {
    res = http.post(url, JSON.stringify({}), { ...params, headers: { 'Content-Type': 'application/json' } });
  } else if (op.method === 'PUT') {
    res = http.put(url, JSON.stringify({}), { ...params, headers: { 'Content-Type': 'application/json' } });
  } else if (op.method === 'DELETE') {
    res = http.del(url, null, params);
  } else {
    res = http.request(op.method, url, null, params);
  }

  check(res, {
    [\`\${op.name} status is \${op.expectedStatus}\`]: (r) => r.status === op.expectedStatus,
  });
${thinkTimeCode}
}
`;

    return script;
  }

  /**
   * Imports a k6 summary JSON object and parses it into a normalized BenchmarkRun
   */
  public static importSummaryJson(
    rawJson: string | Record<string, any>,
    metadata: {
      definitionId: string;
      architectureId: string;
      projectId: string;
      environment: BenchmarkEnvironment;
      workloadProfile: WorkloadProfile;
      runNumber?: number;
    }
  ): BenchmarkRun {
    const data = typeof rawJson === "string" ? JSON.parse(rawJson) : rawJson;

    const metrics = data.metrics || {};
    const reqDuration = metrics["http_req_duration"]?.values || {};
    const reqs = metrics["http_reqs"]?.values || {};
    const reqFailed = metrics["http_req_failed"]?.values || {};
    const iterations = metrics["iterations"]?.values || {};
    const droppedIterations = metrics["dropped_iterations"]?.values?.count || 0;

    const totalRequests = reqs.count || iterations.count || 0;
    const failedRequests = reqFailed.passes || 0;
    const errorRatePct = reqFailed.rate !== undefined ? reqFailed.rate * 100 : (totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0);
    const achievedRps = reqs.rate || 0;

    // Determine offered RPS
    let offeredRps = achievedRps;
    if (metadata.workloadProfile.modelType === "open_loop") {
      offeredRps = metadata.workloadProfile.targetRps;
    }

    const durationSeconds = data.state?.testRunDurationMs
      ? data.state.testRunDurationMs / 1000
      : (totalRequests > 0 && achievedRps > 0 ? totalRequests / achievedRps : 60);

    const p50 = reqDuration["p(50)"] ?? reqDuration["med"] ?? 0;
    const p90 = reqDuration["p(90)"] ?? (reqDuration["p(95)"] ? reqDuration["p(95)"] * 0.9 : p50 * 1.5);
    const p95 = reqDuration["p(95)"] ?? 0;
    const p99 = reqDuration["p(99)"] ?? (p95 > 0 ? p95 * 1.3 : 0);
    const min = reqDuration["min"] ?? 0;
    const max = reqDuration["max"] ?? 0;
    const mean = reqDuration["avg"] ?? 0;

    const droppedIterationsPct = totalRequests + droppedIterations > 0
      ? (droppedIterations / (totalRequests + droppedIterations)) * 100
      : 0;

    // Operation breakdowns if tagged
    const operationSummaries: Record<string, OperationMetricSummary> = {};
    for (const [key, value] of Object.entries(metrics)) {
      if (key.startsWith("http_req_duration{") && (value as any).values) {
        const val = (value as any).values;
        const nameMatch = key.match(/name:([^,}]+)/);
        const compMatch = key.match(/component:([^,}]+)/);
        const opIdMatch = key.match(/operation_id:([^,}]+)/);

        const opId = opIdMatch ? opIdMatch[1] : `op_${Object.keys(operationSummaries).length + 1}`;
        const opName = nameMatch ? nameMatch[1] : opId;
        const compId = compMatch ? compMatch[1] : undefined;

        operationSummaries[opId] = {
          operationId: opId,
          operationName: opName,
          targetComponentId: compId,
          requestCount: val.count || 0,
          failedCount: 0,
          errorRatePct: 0,
          p50LatencyMs: val["p(50)"] ?? val["med"] ?? 0,
          p95LatencyMs: val["p(95)"] ?? 0,
          p99LatencyMs: val["p(99)"] ?? 0,
          achievedRps: val.rate || (val.count && durationSeconds ? val.count / durationSeconds : 0),
        };
      }
    }

    return ResultNormalizer.buildRun({
      benchmarkDefinitionId: metadata.definitionId,
      architectureId: metadata.architectureId,
      projectId: metadata.projectId,
      runNumber: metadata.runNumber ?? 1,
      environment: metadata.environment,
      workloadProfile: metadata.workloadProfile,
      sourceTool: "k6",
      sourceVersion: data.version || "k6 v0.48+",
      durationSeconds,
      metrics: {
        category: "measured",
        totalRequests,
        failedRequests,
        errorRatePct,
        durationSeconds,
        offeredRps,
        achievedRps,
        droppedIterations,
        droppedIterationsPct,
        p50LatencyMs: p50,
        p90LatencyMs: p90,
        p95LatencyMs: p95,
        p99LatencyMs: p99,
        minLatencyMs: min,
        maxLatencyMs: max,
        meanLatencyMs: mean,
      },
      operationSummaries,
      rawSummaryExport: data,
    });
  }
}
