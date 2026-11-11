import type {
  UnifiedFinding,
  AnalysisEngineSource,
  MultiEngineAnalysisInputs,
} from "../contracts/recommendations.types";
import {
  ValidationAdapter,
  HealthAdapter,
  BottleneckAdapter,
  FailureAdapter,
  SecurityAdapter,
  ScalabilityAdapter,
  ReliabilityAdapter,
} from "../adapters";

export class FindingNormalizer {
  public static normalizeAll(inputs: MultiEngineAnalysisInputs): {
    findings: UnifiedFinding[];
    findingsByEngine: Record<AnalysisEngineSource, number>;
  } {
    const allFindings: UnifiedFinding[] = [];
    const counts: Record<AnalysisEngineSource, number> = {
      validation: 0,
      health: 0,
      bottlenecks: 0,
      spof: 0,
      security: 0,
      scalability: 0,
      reliability: 0,
    };

    if (inputs.validation) {
      const adapted = ValidationAdapter.adapt(inputs.validation);
      counts.validation = adapted.length;
      allFindings.push(...adapted);
    }

    if (inputs.healthFindings) {
      const adapted = HealthAdapter.adapt(inputs.healthFindings);
      counts.health = adapted.length;
      allFindings.push(...adapted);
    }

    if (inputs.bottleneckFindings) {
      const adapted = BottleneckAdapter.adapt(inputs.bottleneckFindings);
      counts.bottlenecks = adapted.length;
      allFindings.push(...adapted);
    }

    if (inputs.failureFindings) {
      const adapted = FailureAdapter.adapt(inputs.failureFindings);
      counts.spof = adapted.length;
      allFindings.push(...adapted);
    }

    if (inputs.securityFindings) {
      const adapted = SecurityAdapter.adapt(inputs.securityFindings);
      counts.security = adapted.length;
      allFindings.push(...adapted);
    }

    if (inputs.scalabilityRecommendations) {
      const adapted = ScalabilityAdapter.adapt(inputs.scalabilityRecommendations);
      counts.scalability = adapted.length;
      allFindings.push(...adapted);
    }

    if (inputs.reliabilityFindings) {
      const adapted = ReliabilityAdapter.adapt(inputs.reliabilityFindings);
      counts.reliability = adapted.length;
      allFindings.push(...adapted);
    }

    return {
      findings: allFindings,
      findingsByEngine: counts,
    };
  }
}
