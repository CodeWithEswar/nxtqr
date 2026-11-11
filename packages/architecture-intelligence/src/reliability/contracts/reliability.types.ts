import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type { GraphIndex } from "../../core/graph-index";
import type { BottleneckReport } from "../../bottlenecks/contracts/bottleneck.types";
import type { FailureAnalysisReport } from "../../failure-analysis/contracts/failure.types";
import type {
  ReliabilityCategory,
  ReliabilitySeverity,
  ReliabilityClassification,
  EvidenceItem,
  ReliabilityFinding,
  NodeReliabilityProfile,
  PropagationPath,
  ReliabilitySummary,
  ReliabilityAnalysisReport,
} from "../schemas/reliability.schemas";

export type {
  ReliabilityCategory,
  ReliabilitySeverity,
  ReliabilityClassification,
  EvidenceItem,
  ReliabilityFinding,
  NodeReliabilityProfile,
  PropagationPath,
  ReliabilitySummary,
  ReliabilityAnalysisReport,
};

export interface ReliabilityContext {
  nodes: BaseNode[];
  edges: BaseEdge[];
  graphIndex: GraphIndex;
  nodeMap: Map<string, BaseNode>;
  outgoingEdgesMap: Map<string, BaseEdge[]>;
  incomingEdgesMap: Map<string, BaseEdge[]>;
  nodeProfiles: Record<string, NodeReliabilityProfile>;
  bottleneckReport?: BottleneckReport;
  failureReport?: FailureAnalysisReport;
}

export interface IReliabilityAnalyzer {
  readonly category: ReliabilityCategory;
  analyze(context: ReliabilityContext): ReliabilityFinding[];
}

