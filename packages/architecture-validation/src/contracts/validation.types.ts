import type { BaseNode, BaseEdge, PortDefinition } from "@nxtqr/graph-schema";

export type ValidationSeverity = "error" | "warning" | "info";

export type ConnectionDecision =
  | "allowed"
  | "allowed-with-warnings"
  | "requires-configuration"
  | "rejected";

export type ValidationCategory =
  | "component"
  | "connection"
  | "relationship"
  | "structural"
  | "dependency"
  | "integrity";

export type PortDirection = "input" | "output" | "bidirectional";

export type PortRole =
  | "client"
  | "server"
  | "producer"
  | "consumer"
  | "publisher"
  | "subscriber"
  | "observer"
  | "target"
  | "control"
  | "data"
  | "peer";

export type RelationshipKind =
  | "request-response"
  | "stream"
  | "publish-subscribe"
  | "event-delivery"
  | "database-access"
  | "cache-access"
  | "observability"
  | "control-plane"
  | "dependency"
  | "containment"
  | "annotation"
  | "association"
  | "replication"
  | "storage-access";

export type ProtocolFamily =
  | "http"
  | "https"
  | "rest"
  | "graphql"
  | "grpc"
  | "websocket"
  | "tcp"
  | "udp"
  | "mqtt"
  | "amqp"
  | "kafka"
  | "sql"
  | "redis"
  | "dns"
  | "file-transfer"
  | "custom";

export type TransportSecurity =
  | "none"
  | "tls"
  | "mtls"
  | "ssh"
  | "vpn"
  | "ipsec"
  | "unspecified";

export interface SuggestedAction {
  label: string;
  type: "open-inspector" | "open-docs" | "reverse-direction" | "insert-adapter" | "reconfigure";
  fieldPath?: string;
  documentationPath?: string;
  payload?: Record<string, unknown>;
}

export interface ValidationFinding {
  id: string;
  ruleId: string;
  category: ValidationCategory;
  severity: ValidationSeverity;
  title: string;
  message: string;
  explanation?: string;
  sourceNodeId?: string;
  targetNodeId?: string;
  sourcePortId?: string;
  targetPortId?: string;
  edgeId?: string;
  documentationId?: string;
  documentationPath?: string;
  suggestedActions?: SuggestedAction[];
  timestamp?: number;
}

export interface ArchitecturePort extends PortDefinition {
  direction: PortDirection;
  roles: PortRole[];
  protocols: string[];
  relationshipKinds: RelationshipKind[];
  maxConnections?: number;
}

export interface ConnectionCandidate {
  sourceNodeId: string;
  targetNodeId: string;
  sourceHandleId?: string | null;
  targetHandleId?: string | null;
  edgeId?: string;
  customData?: Record<string, unknown>;
}

export interface ConnectionValidationResult {
  decision: ConnectionDecision;
  valid: boolean;
  findings: ValidationFinding[];
  resolvedRelationship?: RelationshipKind;
  resolvedProtocolId?: string;
  resolvedSecurity?: TransportSecurity;
}

export interface GraphValidationSummary {
  totalFindings: number;
  errors: number;
  warnings: number;
  info: number;
  byCategory: Record<ValidationCategory, number>;
  componentCount: number;
  connectionCount: number;
  isValid: boolean;
}

export interface GraphValidationResult {
  valid: boolean;
  findings: ValidationFinding[];
  summary: GraphValidationSummary;
  findingsByNode: Record<string, ValidationFinding[]>;
  findingsByEdge: Record<string, ValidationFinding[]>;
  validatedAt: number;
}

export interface ResolvedNodeContext {
  node: BaseNode;
  componentId: string;
  categoryId: string;
  capabilities: readonly string[];
  ports: readonly ArchitecturePort[];
  config: Record<string, unknown>;
  isBoundary: boolean;
  isAnnotation: boolean;
}

export interface RuleEvaluationContext {
  nodes: readonly BaseNode[];
  edges: readonly BaseEdge[];
  candidate?: ConnectionCandidate;
  activeEdge?: BaseEdge;
  sourceContext?: ResolvedNodeContext;
  targetContext?: ResolvedNodeContext;
  sourcePort?: ArchitecturePort;
  targetPort?: ArchitecturePort;
}

export interface ValidationRuleOutcome {
  ruleId: string;
  category: ValidationCategory;
  severity: ValidationSeverity;
  title: string;
  message: string;
  explanation?: string;
  documentationId?: string;
  suggestedActions?: SuggestedAction[];
  decisionEffect?: ConnectionDecision;
}

export interface ArchitectureValidationRule {
  id: string;
  version: number;
  name: string;
  description: string;
  category: ValidationCategory;
  order: number;
  evaluate(context: RuleEvaluationContext): ValidationRuleOutcome | null;
}
