import { z } from "zod";

export const ReviewStatusSchema = z.enum([
  "draft",
  "open",
  "changes_requested",
  "approved",
  "ready_to_apply",
  "applied",
  "closed",
  "superseded",
  "stale",
]);

export const ReviewDecisionKindSchema = z.enum([
  "approve",
  "request_changes",
  "comment",
]);

export const ReviewerRoleSchema = z.enum([
  "author",
  "reviewer",
  "lead_architect",
  "security_reviewer",
  "admin",
]);

export const CheckStatusSchema = z.enum([
  "pending",
  "running",
  "passed",
  "failed",
  "warning",
  "unavailable",
  "stale",
]);

export const ReviewCheckCategorySchema = z.enum([
  "validation",
  "health",
  "bottlenecks",
  "spof",
  "security",
  "reliability",
  "capacity",
  "cost",
  "regression",
]);

export const ReviewCommentAnchorSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("node"),
    nodeId: z.string().min(1),
    nodeLabel: z.string().optional(),
  }),
  z.object({
    type: z.literal("edge"),
    edgeId: z.string().min(1),
    source: z.string().optional(),
    target: z.string().optional(),
  }),
  z.object({
    type: z.literal("field"),
    nodeId: z.string().min(1),
    fieldPath: z.string().min(1),
    oldValue: z.unknown().optional(),
    newValue: z.unknown().optional(),
  }),
  z.object({
    type: z.literal("finding"),
    findingId: z.string().min(1),
    engine: z.string().optional(),
  }),
  z.object({
    type: z.literal("diff"),
    changeId: z.string().min(1),
    elementId: z.string().optional(),
  }),
  z.object({
    type: z.literal("general"),
  }),
]);

export const ReviewCommentSchema = z.object({
  id: z.string().min(1),
  threadId: z.string().min(1),
  reviewId: z.string().min(1),
  revisionNumber: z.number().int().min(1),
  authorId: z.string().min(1),
  authorName: z.string().min(1),
  content: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
  isEdited: z.boolean().optional(),
});

export const ReviewCommentThreadSchema = z.object({
  id: z.string().min(1),
  reviewId: z.string().min(1),
  revisionNumber: z.number().int().min(1),
  anchor: ReviewCommentAnchorSchema,
  rootComment: ReviewCommentSchema,
  replies: z.array(ReviewCommentSchema).default([]),
  status: z.enum(["open", "resolved", "reopened"]),
  isBlocking: z.boolean().default(false),
  resolvedBy: z.string().optional(),
  resolvedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ReviewCheckSchema = z.object({
  id: z.string().min(1),
  ruleId: z.string().min(1),
  name: z.string().min(1),
  category: ReviewCheckCategorySchema,
  status: CheckStatusSchema,
  severity: z.enum(["critical", "high", "medium", "low", "info"]),
  message: z.string(),
  evidenceIds: z.array(z.string()).optional(),
  executedAt: z.string(),
});

export const ReviewDecisionRecordSchema = z.object({
  id: z.string().min(1),
  reviewId: z.string().min(1),
  revisionNumber: z.number().int().min(1),
  reviewerId: z.string().min(1),
  reviewerName: z.string().min(1),
  reviewerRole: ReviewerRoleSchema,
  decision: ReviewDecisionKindSchema,
  explanation: z.string().optional(),
  createdAt: z.string(),
});

export const ReviewPolicySchema = z.object({
  minApprovals: z.number().int().min(1).default(1),
  requiredReviewerRoles: z.array(ReviewerRoleSchema).default([]),
  requireAllChecksPassed: z.boolean().default(true),
  requireResolvedThreads: z.boolean().default(true),
  allowSelfApproval: z.boolean().default(false),
  invalidateApprovalsOnRevision: z.boolean().default(true),
});

export const ReviewerAssignmentSchema = z.object({
  reviewerId: z.string().min(1),
  name: z.string().min(1),
  role: ReviewerRoleSchema,
  assignedAt: z.string(),
});

export const ReviewAuditEventSchema = z.object({
  id: z.string().min(1),
  reviewId: z.string().min(1),
  revisionNumber: z.number().int().min(1),
  action: z.string().min(1),
  actorId: z.string().min(1),
  actorName: z.string().min(1),
  payload: z.record(z.unknown()).optional(),
  timestamp: z.string(),
});
