import type { ArchitectureSnapshot } from "../../comparison/contracts/comparison.types";

export type ReviewStatus =
  | "draft"
  | "open"
  | "changes_requested"
  | "approved"
  | "ready_to_apply"
  | "applied"
  | "closed"
  | "superseded"
  | "stale";

export type ReviewDecisionKind = "approve" | "request_changes" | "comment";

export type ReviewerRole =
  | "author"
  | "reviewer"
  | "lead_architect"
  | "security_reviewer"
  | "admin";

export type CheckStatus =
  | "pending"
  | "running"
  | "passed"
  | "failed"
  | "warning"
  | "unavailable"
  | "stale";

export type ReviewCheckCategory =
  | "validation"
  | "health"
  | "bottlenecks"
  | "spof"
  | "security"
  | "reliability"
  | "capacity"
  | "cost"
  | "regression";

export type ReviewCommentAnchor =
  | { type: "node"; nodeId: string; nodeLabel?: string }
  | { type: "edge"; edgeId: string; source?: string; target?: string }
  | { type: "field"; nodeId: string; fieldPath: string; oldValue?: unknown; newValue?: unknown }
  | { type: "finding"; findingId: string; engine?: string }
  | { type: "diff"; changeId: string; elementId?: string }
  | { type: "general" };

export interface ReviewComment {
  id: string;
  threadId: string;
  reviewId: string;
  revisionNumber: number;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isEdited?: boolean;
}

export interface ReviewCommentThread {
  id: string;
  reviewId: string;
  revisionNumber: number;
  anchor: ReviewCommentAnchor;
  rootComment: ReviewComment;
  replies: ReviewComment[];
  status: "open" | "resolved" | "reopened";
  isBlocking: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewCheck {
  id: string;
  ruleId: string;
  name: string;
  category: ReviewCheckCategory;
  status: CheckStatus;
  severity: "critical" | "high" | "medium" | "low" | "info";
  message: string;
  evidenceIds?: string[];
  executedAt: string;
}

export interface ReviewDecisionRecord {
  id: string;
  reviewId: string;
  revisionNumber: number;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: ReviewerRole;
  decision: ReviewDecisionKind;
  explanation?: string;
  createdAt: string;
}

export interface ArchitectureReviewRevision {
  id: string;
  reviewId: string;
  revisionNumber: number;
  candidateSnapshot: ArchitectureSnapshot;
  contentHash: string;
  changeSummary: string;
  createdAt: string;
  authorId: string;
}

export interface ReviewPolicy {
  minApprovals: number;
  requiredReviewerRoles: ReviewerRole[];
  requireAllChecksPassed: boolean;
  requireResolvedThreads: boolean;
  allowSelfApproval: boolean;
  invalidateApprovalsOnRevision: boolean;
}

export interface ApprovalEvaluationResult {
  isApproved: boolean;
  isReadyToApply: boolean;
  totalApprovals: number;
  requiredApprovals: number;
  missingApprovalsCount: number;
  satisfiedRoles: ReviewerRole[];
  missingRoles: ReviewerRole[];
  blockingChecks: ReviewCheck[];
  unresolvedThreadsCount: number;
  hasRequestedChanges: boolean;
  violations: string[];
}

export interface ReviewerAssignment {
  reviewerId: string;
  name: string;
  role: ReviewerRole;
  assignedAt: string;
}

export interface ReviewAuditEvent {
  id: string;
  reviewId: string;
  revisionNumber: number;
  action: string;
  actorId: string;
  actorName: string;
  payload?: Record<string, unknown>;
  timestamp: string;
}

export interface ArchitectureReview {
  id: string;
  projectId: string;
  architectureId: string;
  authorId: string;
  authorName: string;
  title: string;
  description: string;
  baselineSnapshot: ArchitectureSnapshot;
  currentRevisionNumber: number;
  revisions: ArchitectureReviewRevision[];
  status: ReviewStatus;
  assignedReviewers: ReviewerAssignment[];
  decisions: ReviewDecisionRecord[];
  threads: ReviewCommentThread[];
  checks: ReviewCheck[];
  policy: ReviewPolicy;
  auditTrail: ReviewAuditEvent[];
  appliedAt?: string;
  appliedBy?: string;
  appliedGraphRevision?: string;
  relatedAdrIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewInput {
  id?: string;
  projectId: string;
  architectureId: string;
  authorId: string;
  authorName: string;
  title: string;
  description: string;
  baselineSnapshot: ArchitectureSnapshot;
  candidateSnapshot: ArchitectureSnapshot;
  policy?: Partial<ReviewPolicy>;
  assignedReviewers?: Array<{ reviewerId: string; name: string; role: ReviewerRole }>;
  relatedAdrIds?: string[];
}

export interface ApplyProposalResult {
  success: boolean;
  committedRevision: string;
  nodesAppliedCount: number;
  edgesAppliedCount: number;
  deviationsFromCandidate: string[];
  appliedSnapshot: ArchitectureSnapshot;
  appliedAt: string;
  error?: string;
}

export interface RebaseAnalysisResult {
  isConflictFree: boolean;
  baselineRevision: string;
  currentLiveRevision: string;
  divergedNodeIds: string[];
  divergedEdgeIds: string[];
  conflictingOperations: string[];
  rebasedCandidate?: ArchitectureSnapshot;
}
