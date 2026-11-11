/**
 * Architecture Messaging Intelligence — Saga Workflow Analyzer
 *
 * Analyzes choreographed and orchestrated distributed transaction Sagas.
 * Verifies compensation completeness, uncompensated intermediate states,
 * missing timeout guards, and orphaned states during failure rollbacks.
 */

import {
  MessagingTopology,
  SagaWorkflow,
  SagaStateTransition,
  MessagingFinding,
} from "../contracts/messaging.types";

export interface SagaAnalysisResult {
  analyzedSagas: SagaWorkflow[];
  findings: MessagingFinding[];
}

export class SagaWorkflowAnalyzer {
  public analyze(topology: MessagingTopology): SagaAnalysisResult {
    const analyzedSagas: SagaWorkflow[] = [];
    const findings: MessagingFinding[] = [];

    if (!topology.sagas || topology.sagas.length === 0) {
      return { analyzedSagas, findings };
    }

    for (const rawSaga of topology.sagas) {
      const { saga, sagaFindings } = this.analyzeSaga(rawSaga);
      analyzedSagas.push(saga);
      findings.push(...sagaFindings);
    }

    return { analyzedSagas, findings };
  }

  private analyzeSaga(rawSaga: SagaWorkflow): {
    saga: SagaWorkflow;
    sagaFindings: MessagingFinding[];
  } {
    const sagaFindings: MessagingFinding[] = [];
    const uncompensatedStates: string[] = [];
    const potentialOrphanedStates: string[] = [];

    const terminalStates = new Set([
      ...rawSaga.terminalSuccessStates,
      ...rawSaga.terminalFailureStates,
    ]);

    // Group transitions by fromState
    const transitionsByFrom = new Map<string, SagaStateTransition[]>();
    for (const t of rawSaga.transitions) {
      const list = transitionsByFrom.get(t.fromState) || [];
      list.push(t);
      transitionsByFrom.set(t.fromState, list);
    }

    // 1. Identify intermediate states with outgoing forward transitions but no compensating transitions
    for (const state of rawSaga.states) {
      if (terminalStates.has(state)) continue;

      const outgoing = transitionsByFrom.get(state) || [];
      if (outgoing.length === 0) {
        // Non-terminal state with no outgoing transitions is an orphaned dead end!
        potentialOrphanedStates.push(state);
        sagaFindings.push({
          id: `saga-dead-end-${rawSaga.id}-${state}`,
          category: "incomplete_saga_compensation",
          severity: "high",
          title: `Saga Dead-End State: "${state}" in "${rawSaga.name}"`,
          explanation: `State "${state}" in Saga "${rawSaga.name}" is not listed as a terminal success or terminal failure state, yet has no outgoing transitions. Workflows entering this state will hang forever.`,
          evidence: [
            `Saga: ${rawSaga.name} (${rawSaga.type})`,
            `State: ${state}`,
            `Outgoing transitions: 0`,
          ],
          riskAnalysis:
            "Orders or business processes become permanently stuck in limbo, requiring manual database interventions.",
          remediation:
            "Add explicit forward or compensating failure transitions, or mark this state as terminal.",
        });
      } else {
        // Check if any outgoing transition is a compensation
        const hasCompensation = outgoing.some((t) => t.isCompensating);
        // If there is a failure pathway reachable from here, does it have a compensation?
        const hasFailurePathway = outgoing.some(
          (t) => rawSaga.terminalFailureStates.includes(t.toState) || t.toState.toLowerCase().includes("fail")
        );

        if (hasFailurePathway && !hasCompensation) {
          uncompensatedStates.push(state);
          sagaFindings.push({
            id: `saga-uncompensated-${rawSaga.id}-${state}`,
            category: "incomplete_saga_compensation",
            severity: "critical",
            title: `Uncompensated Failure in Saga "${rawSaga.name}" at State "${state}"`,
            explanation: `State "${state}" in Saga "${rawSaga.name}" transitions directly to failure without executing compensating actions for earlier steps. Any external side-effects executed prior to reaching "${state}" will remain un-reverted.`,
            evidence: [
              `Saga: ${rawSaga.name}`,
              `Triggering state: ${state}`,
              `Transitions to failure without compensation`,
            ],
            riskAnalysis:
              "Distributed data inconsistency: money charged without reservation, inventory locked without order completion, or orphaned database rows.",
            remediation:
              "Define explicit compensating state transitions with compensating actions (e.g. refund_payment, release_inventory_hold).",
          });
        }

        // Check for missing timeout handlers
        for (const t of outgoing) {
          if (!t.timeoutSeconds && !terminalStates.has(t.toState)) {
            // Asynchronous state transition without timeout
            sagaFindings.push({
              id: `saga-missing-timeout-${rawSaga.id}-${t.fromState}-${t.toState}`,
              category: "incomplete_saga_compensation",
              severity: "medium",
              title: `Missing Timeout Guard in Saga Transition (${t.fromState} -> ${t.toState})`,
              explanation: `Transition from "${t.fromState}" to "${t.toState}" on event "${t.triggerEvent}" has no configured timeout limit. If action service "${t.actionServiceId}" crashes or fails to emit a reply, the Saga hangs indefinitely.`,
              evidence: [
                `Transition: ${t.fromState} -> ${t.toState}`,
                `Service: ${t.actionServiceId}`,
                `Configured timeoutSeconds: undefined`,
              ],
              riskAnalysis:
                "Resource leak: pending sagas accumulate in memory or database storage during downstream network partitions.",
              remediation:
                "Configure a strict timeoutSeconds policy on the transition to automatically trigger a compensating rollback upon expiration.",
            });
          }
        }
      }
    }

    const isFullyCompensated = uncompensatedStates.length === 0;
    let riskSummary = "Saga workflow is consistent and fully compensated across all failure branches.";
    if (!isFullyCompensated) {
      riskSummary = `Saga has ${uncompensatedStates.length} uncompensated state(s) (${uncompensatedStates.join(
        ", "
      )}) leading to distributed inconsistency upon failure.`;
    }
    if (potentialOrphanedStates.length > 0) {
      riskSummary += ` Identified ${potentialOrphanedStates.length} orphaned/hanging state(s) (${potentialOrphanedStates.join(
        ", "
      )}).`;
    }

    const updatedSaga: SagaWorkflow = {
      ...rawSaga,
      consistencyAnalysis: {
        isFullyCompensated,
        uncompensatedStates,
        potentialOrphanedStates,
        riskSummary,
      },
    };

    return { saga: updatedSaga, sagaFindings };
  }
}
