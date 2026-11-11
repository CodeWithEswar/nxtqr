import type { BaseNode } from "@nxtqr/graph-schema";
import type {
  BenchmarkRun,
  BottleneckValidation,
  ModelCalibrationProposal,
} from "../contracts/performance.types";

export interface PredictedBottleneckInfo {
  nodeId: string;
  nodeLabel: string;
  predictedSaturationRps?: number;
  reason?: string;
}

export class ModelCalibrator {
  /**
   * Validates bottleneck predictions against measured benchmark telemetry
   */
  public static validateBottlenecks(
    nodes: BaseNode[],
    predictions: PredictedBottleneckInfo[],
    run: BenchmarkRun
  ): BottleneckValidation[] {
    const validations: BottleneckValidation[] = [];
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    for (const pred of predictions) {
      const node = nodeMap.get(pred.nodeId);
      const label = pred.nodeLabel || (node?.data?.label as string) || pred.nodeId;

      // Find matching operation summary if mapped
      let mappedOpSummary = Object.values(run.operationSummaries).find(
        (op) => op.targetComponentId === pred.nodeId
      );

      // If no explicit mapping, fallback to overall run metrics if test targeted this component
      const measuredP95 = mappedOpSummary?.p95LatencyMs ?? run.overallSummary.p95LatencyMs;
      const measuredRps = mappedOpSummary?.achievedRps ?? run.overallSummary.achievedRps;

      let verdict: "supported" | "contradicted" | "inconclusive" = "inconclusive";
      let explanation = "";

      if (pred.predictedSaturationRps !== undefined) {
        if (run.overallSummary.offeredRps < pred.predictedSaturationRps * 0.7) {
          verdict = "inconclusive";
          explanation = `Test workload offered ${run.overallSummary.offeredRps} RPS, which is below the predicted saturation threshold (${pred.predictedSaturationRps} RPS).`;
        } else if (
          measuredRps >= pred.predictedSaturationRps * 0.9 &&
          (measuredP95 > 250 || run.overallSummary.errorRatePct > 1 || run.overallSummary.droppedIterations > 0)
        ) {
          verdict = "supported";
          explanation = `Measured saturation observed at ${measuredRps.toFixed(1)} RPS with P95 latency rising to ${measuredP95.toFixed(1)}ms. Supports modeled bottleneck prediction.`;
        } else if (measuredRps >= pred.predictedSaturationRps && measuredP95 < 50 && run.overallSummary.errorRatePct < 0.1) {
          verdict = "contradicted";
          explanation = `Component achieved ${measuredRps.toFixed(1)} RPS with stable low latency (${measuredP95.toFixed(1)}ms), defying predicted bottleneck ceiling (${pred.predictedSaturationRps} RPS).`;
        } else {
          verdict = "supported";
          explanation = `Performance curve degraded around predicted threshold (${pred.predictedSaturationRps} RPS).`;
        }
      } else {
        // Latency-based evaluation
        if (measuredP95 > 200) {
          verdict = "supported";
          explanation = `Measured high P95 latency (${measuredP95.toFixed(1)}ms) supports bottleneck designation.`;
        } else if (run.overallSummary.totalRequests > 500 && measuredP95 < 30) {
          verdict = "contradicted";
          explanation = `Measured low P95 latency (${measuredP95.toFixed(1)}ms) contradicts predicted bottleneck.`;
        } else {
          verdict = "inconclusive";
          explanation = "Insufficient saturation to confirm or refute bottleneck hypothesis.";
        }
      }

      validations.push({
        componentId: pred.nodeId,
        componentLabel: label,
        predictedBottleneck: true,
        predictedSaturationRps: pred.predictedSaturationRps,
        measuredMaxRps: Number(measuredRps.toFixed(1)),
        measuredP95LatencyMs: Number(measuredP95.toFixed(1)),
        verdict,
        explanation,
      });
    }

    return validations;
  }

  /**
   * Generates model calibration proposals when measured results diverge from architecture assumptions
   */
  public static proposeCalibrations(
    nodes: BaseNode[],
    run: BenchmarkRun
  ): ModelCalibrationProposal[] {
    const proposals: ModelCalibrationProposal[] = [];

    for (const node of nodes) {
      const data = node.data || {};
      const label = (data.label as string) || node.id;

      // Check for mapped operations
      const op = Object.values(run.operationSummaries).find(
        (o) => o.targetComponentId === node.id
      );

      const measuredLatency = op ? op.p50LatencyMs : run.overallSummary.p50LatencyMs;
      const modeledLatency = typeof data.latencyMs === "number" ? data.latencyMs : undefined;

      if (modeledLatency !== undefined && measuredLatency > 0) {
        const delta = Math.abs(measuredLatency - modeledLatency);
        if (delta > 20 || delta / modeledLatency > 0.5) {
          proposals.push({
            componentId: node.id,
            componentLabel: label,
            parameterName: "latencyMs",
            modeledValue: modeledLatency,
            measuredValue: measuredLatency,
            recommendedCalibration: Math.round(measuredLatency),
            confidence: run.dataQuality.status === "high" ? "high" : "moderate",
            justification: `Modeled baseline latency (${modeledLatency}ms) differs from benchmark median (${measuredLatency.toFixed(1)}ms). Update component model to improve capacity forecast precision.`,
          });
        }
      }

      // Max throughput calibration if capped
      const modeledThroughput = typeof data.maxRps === "number" ? data.maxRps : undefined;
      const measuredThroughput = op ? op.achievedRps : run.overallSummary.achievedRps;

      if (
        modeledThroughput !== undefined &&
        run.overallSummary.offeredRps > modeledThroughput &&
        measuredThroughput > modeledThroughput * 1.3
      ) {
        proposals.push({
          componentId: node.id,
          componentLabel: label,
          parameterName: "maxRps",
          modeledValue: modeledThroughput,
          measuredValue: Math.round(measuredThroughput),
          recommendedCalibration: Math.round(measuredThroughput),
          confidence: "moderate",
          justification: `Component sustained ${measuredThroughput.toFixed(0)} RPS under load, exceeding modeled maximum capacity of ${modeledThroughput} RPS.`,
        });
      }
    }

    return proposals;
  }
}
