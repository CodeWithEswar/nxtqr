import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type {
  SecurityCategory,
  STRIDECategory,
  SecurityFindingClassification,
  ExposureClassification,
  DataSensitivity,
  TrustLevel,
  SecurityControlKind,
  SecurityFinding,
  TrustBoundaryCrossing,
  NodeSecurityProfile,
  SecurityAnalysisReport,
} from "../schemas/security.schemas";

export type {
  SecurityCategory,
  STRIDECategory,
  SecurityFindingClassification,
  ExposureClassification,
  DataSensitivity,
  TrustLevel,
  SecurityControlKind,
  SecurityFinding,
  TrustBoundaryCrossing,
  NodeSecurityProfile,
  SecurityAnalysisReport,
};

export interface SecurityRule {
  id: string;
  version: number;
  category: SecurityCategory;
  strideCategory?: STRIDECategory;
  title: string;
  description: string;
  severityOnMatch: "critical" | "high" | "medium" | "low" | "info";
  classification: SecurityFindingClassification;
  documentationId?: string;
}

export interface SecurityEvaluationContext {
  nodes: BaseNode[];
  edges: BaseEdge[];
  nodeMap: Map<string, BaseNode>;
  outgoingEdgesMap: Map<string, BaseEdge[]>;
  incomingEdgesMap: Map<string, BaseEdge[]>;
  nodeProfiles: Map<string, NodeSecurityProfile>;
  trustBoundaries: Array<{
    id: string;
    name: string;
    zone: string;
    containedNodeIds: string[];
    crossingEdgeIds: string[];
    findingsCount: number;
  }>;
  crossings: TrustBoundaryCrossing[];
}

export interface ISecurityAnalyzer {
  readonly id: string;
  readonly category: SecurityCategory;
  analyze(context: SecurityEvaluationContext): SecurityFinding[];
}
