import type {
  ArchitectureReview,
  ReviewComment,
  ReviewCommentAnchor,
  ReviewCommentThread,
  ReviewAuditEvent,
} from "../contracts/review.types";

export class ThreadManager {
  public static createThread(
    review: ArchitectureReview,
    input: {
      anchor: ReviewCommentAnchor;
      authorId: string;
      authorName: string;
      content: string;
      isBlocking?: boolean;
    }
  ): { review: ArchitectureReview; thread: ReviewCommentThread } {
    const now = new Date().toISOString();
    const threadId = `th-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const commentId = `cm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

    const rootComment: ReviewComment = {
      id: commentId,
      threadId,
      reviewId: review.id,
      revisionNumber: review.currentRevisionNumber,
      authorId: input.authorId,
      authorName: input.authorName,
      content: input.content,
      createdAt: now,
      updatedAt: now,
    };

    const thread: ReviewCommentThread = {
      id: threadId,
      reviewId: review.id,
      revisionNumber: review.currentRevisionNumber,
      anchor: input.anchor,
      rootComment,
      replies: [],
      status: "open",
      isBlocking: Boolean(input.isBlocking),
      createdAt: now,
      updatedAt: now,
    };

    const auditEvent: ReviewAuditEvent = {
      id: `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      reviewId: review.id,
      revisionNumber: review.currentRevisionNumber,
      action: "comment_thread_created",
      actorId: input.authorId,
      actorName: input.authorName,
      payload: { threadId, anchor: input.anchor, isBlocking: input.isBlocking },
      timestamp: now,
    };

    return {
      review: {
        ...review,
        threads: [thread, ...review.threads],
        updatedAt: now,
        auditTrail: [auditEvent, ...review.auditTrail],
      },
      thread,
    };
  }

  public static addReply(
    review: ArchitectureReview,
    threadId: string,
    input: {
      authorId: string;
      authorName: string;
      content: string;
    }
  ): { review: ArchitectureReview; reply: ReviewComment } {
    const thread = review.threads.find((t) => t.id === threadId);
    if (!thread) {
      throw new Error(`Comment thread '${threadId}' not found.`);
    }

    const now = new Date().toISOString();
    const replyId = `cm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

    const reply: ReviewComment = {
      id: replyId,
      threadId,
      reviewId: review.id,
      revisionNumber: review.currentRevisionNumber,
      authorId: input.authorId,
      authorName: input.authorName,
      content: input.content,
      createdAt: now,
      updatedAt: now,
    };

    const updatedThread: ReviewCommentThread = {
      ...thread,
      replies: [...thread.replies, reply],
      updatedAt: now,
    };

    const auditEvent: ReviewAuditEvent = {
      id: `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      reviewId: review.id,
      revisionNumber: review.currentRevisionNumber,
      action: "comment_reply_added",
      actorId: input.authorId,
      actorName: input.authorName,
      payload: { threadId, replyId },
      timestamp: now,
    };

    return {
      review: {
        ...review,
        threads: review.threads.map((t) => (t.id === threadId ? updatedThread : t)),
        updatedAt: now,
        auditTrail: [auditEvent, ...review.auditTrail],
      },
      reply,
    };
  }

  public static resolveThread(
    review: ArchitectureReview,
    threadId: string,
    resolverId: string
  ): ArchitectureReview {
    const thread = review.threads.find((t) => t.id === threadId);
    if (!thread) {
      throw new Error(`Comment thread '${threadId}' not found.`);
    }

    const now = new Date().toISOString();
    const updatedThread: ReviewCommentThread = {
      ...thread,
      status: "resolved",
      resolvedBy: resolverId,
      resolvedAt: now,
      updatedAt: now,
    };

    const auditEvent: ReviewAuditEvent = {
      id: `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      reviewId: review.id,
      revisionNumber: review.currentRevisionNumber,
      action: "comment_thread_resolved",
      actorId: resolverId,
      actorName: resolverId,
      payload: { threadId },
      timestamp: now,
    };

    return {
      ...review,
      threads: review.threads.map((t) => (t.id === threadId ? updatedThread : t)),
      updatedAt: now,
      auditTrail: [auditEvent, ...review.auditTrail],
    };
  }

  public static reopenThread(
    review: ArchitectureReview,
    threadId: string,
    actorId: string
  ): ArchitectureReview {
    const thread = review.threads.find((t) => t.id === threadId);
    if (!thread) {
      throw new Error(`Comment thread '${threadId}' not found.`);
    }

    const now = new Date().toISOString();
    const updatedThread: ReviewCommentThread = {
      ...thread,
      status: "reopened",
      resolvedBy: undefined,
      resolvedAt: undefined,
      updatedAt: now,
    };

    const auditEvent: ReviewAuditEvent = {
      id: `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      reviewId: review.id,
      revisionNumber: review.currentRevisionNumber,
      action: "comment_thread_reopened",
      actorId,
      actorName: actorId,
      payload: { threadId },
      timestamp: now,
    };

    return {
      ...review,
      threads: review.threads.map((t) => (t.id === threadId ? updatedThread : t)),
      updatedAt: now,
      auditTrail: [auditEvent, ...review.auditTrail],
    };
  }

  public static getThreadsForNode(review: ArchitectureReview, nodeId: string): ReviewCommentThread[] {
    return review.threads.filter(
      (t) => (t.anchor.type === "node" || t.anchor.type === "field") && t.anchor.nodeId === nodeId
    );
  }

  public static getThreadsForEdge(review: ArchitectureReview, edgeId: string): ReviewCommentThread[] {
    return review.threads.filter(
      (t) => t.anchor.type === "edge" && t.anchor.edgeId === edgeId
    );
  }
}
