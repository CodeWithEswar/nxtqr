import type { AnalyzerContext, DimensionAssessment } from "../contracts/health.types";

export interface IAnalyzer {
  analyze(context: AnalyzerContext): DimensionAssessment;
}

