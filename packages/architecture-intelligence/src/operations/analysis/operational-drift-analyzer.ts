/**
 * NXTQR — Phase 05.3.27: Architecture Incident Response, Disaster Recovery & Operational Readiness Intelligence Engine
 * Operational Drift Analyzer
 */

import type { BaseNode } from "@nxtqr/graph-schema";
import type {
  OperationalProject,
  OperationalDriftResult,
  OperationalDriftItem,
} from "../contracts/operations.types";

export class OperationalDriftAnalyzer {
  /**
   * Compares the operational project configuration against the current architecture graph
   * to detect operational drift, unmapped services, missing owners, and stale review dates.
   */
  public static analyzeDrift(
    project: OperationalProject,
    nodes: BaseNode[]
  ): OperationalDriftResult {
    const driftItems: OperationalDriftItem[] = [];
    const validNodeIdSet = new Set<string>(nodes.map((n) => n.id));
    const nowMs = Date.now();
    const SIX_MONTHS_MS = 180 * 24 * 60 * 60 * 1000;

    // 1. Detect unmapped architecture services in runbooks
    const coveredComponentIds = new Set<string>();
    for (const rb of project.runbooks) {
      for (const cid of rb.applicableComponentIds) {
        coveredComponentIds.add(cid);
      }
    }

    let unmappedServicesCount = 0;
    for (const node of nodes) {
      const nodeType = (node.data as any)?.nodeType;
      // Focus on workloads and data stores
      if (nodeType === "service" || nodeType === "database" || nodeType === "gateway") {
        if (!coveredComponentIds.has(node.id)) {
          unmappedServicesCount++;
          driftItems.push({
            id: `drift-unmapped-${node.id}`,
            itemType: "unmapped_service",
            severity: "high",
            description: `Active architectural component '${(node.data as any)?.label || node.id}' is not covered by any operational runbook.`,
            affectedComponentId: node.id,
            suggestedAction: `Create or link an operational runbook for component '${node.id}'.`,
          });
        }
      }
    }

    // 2. Detect missing ownership mappings
    const ownedServiceIds = new Set<string>(project.ownerships.map((o) => o.serviceId));
    for (const node of nodes) {
      const nodeType = (node.data as any)?.nodeType;
      if (nodeType === "service" || nodeType === "database") {
        if (!ownedServiceIds.has(node.id)) {
          driftItems.push({
            id: `drift-owner-missing-${node.id}`,
            itemType: "missing_owner",
            severity: "critical",
            description: `Component '${(node.data as any)?.label || node.id}' has no designated service owner or on-call team.`,
            affectedComponentId: node.id,
            suggestedAction: `Assign primary responder ownership and an escalation policy to '${node.id}'.`,
          });
        }
      }
    }

    // 3. Detect stale runbooks
    let staleRunbooksCount = 0;
    for (const rb of project.runbooks) {
      const retiredComponents = rb.applicableComponentIds.filter((cid) => !validNodeIdSet.has(cid));
      if (retiredComponents.length > 0) {
        staleRunbooksCount++;
        driftItems.push({
          id: `drift-stale-rb-${rb.id}`,
          itemType: "stale_runbook",
          severity: "high",
          description: `Runbook '${rb.title}' references retired components [${retiredComponents.join(", ")}].`,
          suggestedAction: `Update runbook '${rb.id}' scope to match the active architecture.`,
        });
      }

      const reviewDateMs = new Date(rb.reviewDate).getTime();
      if (!isNaN(reviewDateMs) && nowMs - reviewDateMs > SIX_MONTHS_MS) {
        staleRunbooksCount++;
        driftItems.push({
          id: `drift-review-overdue-${rb.id}`,
          itemType: "stale_runbook",
          severity: "medium",
          description: `Runbook '${rb.title}' review is overdue (> 180 days).`,
          suggestedAction: `Schedule a review of runbook '${rb.id}' with designated owner '${rb.owner}'.`,
        });
      }
    }

    // 4. Detect expired tabletop exercises
    for (const ex of project.tabletopExercises) {
      if (ex.status === "completed" && ex.completedAt) {
        const completedMs = new Date(ex.completedAt).getTime();
        if (nowMs - completedMs > SIX_MONTHS_MS) {
          driftItems.push({
            id: `drift-ttx-expired-${ex.id}`,
            itemType: "expired_exercise",
            severity: "medium",
            description: `Tabletop exercise '${ex.title}' was completed more than 6 months ago.`,
            suggestedAction: "Schedule a recurring tabletop exercise to refresh responder training.",
          });
        }
      }
    }

    return {
      hasDrift: driftItems.length > 0,
      driftItems,
      staleRunbooksCount,
      unmappedServicesCount,
      evaluatedAt: new Date().toISOString(),
    };
  }
}

