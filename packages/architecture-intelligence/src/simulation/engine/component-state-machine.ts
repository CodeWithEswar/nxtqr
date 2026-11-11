import type { BaseNode } from "@nxtqr/graph-schema";
import type {
  ComponentSimulationState,
  ComponentStateSnapshot,
} from "../contracts/simulation.types";

interface InternalNodeState {
  nodeId: string;
  baseReplicas: number;
  activeReplicas: number;
  activeFailures: Set<string>;
  isCircuitOpen: boolean;
  isDegraded: boolean;
  latencyMultiplier: number;
  unprocessedBacklog: number;
  reason?: string;
}

export class ComponentStateMachine {
  private states = new Map<string, InternalNodeState>();

  constructor(nodes: BaseNode[]) {
    for (const node of nodes) {
      const data = (node.data || {}) as Record<string, unknown>;
      const replicas = Math.max(1, Number(data.replicas || data.instanceCount || 1));

      this.states.set(node.id, {
        nodeId: node.id,
        baseReplicas: replicas,
        activeReplicas: replicas,
        activeFailures: new Set<string>(),
        isCircuitOpen: false,
        isDegraded: false,
        latencyMultiplier: 1.0,
        unprocessedBacklog: 0,
        reason: undefined,
      });
    }
  }

  public getDerivedState(nodeId: string): ComponentSimulationState {
    const s = this.states.get(nodeId);
    if (!s) return "unknown";

    if (s.activeReplicas === 0 || s.activeFailures.size > 0) {
      if (s.activeReplicas > 0 && s.activeFailures.size === 0) {
        return "degraded";
      }
      return "unavailable";
    }

    if (s.isCircuitOpen || s.isDegraded || s.latencyMultiplier > 1.5 || s.unprocessedBacklog > 500) {
      return "degraded";
    }

    return "healthy";
  }

  public getState(nodeId: string): ComponentSimulationState {
    return this.getDerivedState(nodeId);
  }

  public getActiveFailures(nodeId: string): string[] {
    const s = this.states.get(nodeId);
    return s ? Array.from(s.activeFailures) : [];
  }

  public isCircuitOpen(nodeId: string): boolean {
    return this.states.get(nodeId)?.isCircuitOpen || false;
  }

  public injectFailure(nodeId: string, failureId: string, reason?: string): void {
    const s = this.states.get(nodeId);
    if (!s) return;

    s.activeFailures.add(failureId);
    s.reason = reason || "Direct failure injected";
  }

  public removeFailure(nodeId: string, failureId: string): void {
    const s = this.states.get(nodeId);
    if (!s) return;

    s.activeFailures.delete(failureId);
    if (s.activeFailures.size === 0) {
      s.reason = undefined;
    }
  }

  public setDegraded(nodeId: string, degraded: boolean, reason?: string, latencyMult = 2.0): void {
    const s = this.states.get(nodeId);
    if (!s) return;

    s.isDegraded = degraded;
    s.latencyMultiplier = degraded ? latencyMult : 1.0;
    if (reason) s.reason = reason;
  }

  public setCircuitBreaker(nodeId: string, open: boolean, reason?: string): void {
    const s = this.states.get(nodeId);
    if (!s) return;

    s.isCircuitOpen = open;
    if (open) s.reason = reason || "Circuit breaker open";
  }

  public adjustReplicas(nodeId: string, activeReplicas: number, reason?: string): void {
    const s = this.states.get(nodeId);
    if (!s) return;

    s.activeReplicas = Math.max(0, activeReplicas);
    if (reason) s.reason = reason;
  }

  public updateBacklog(nodeId: string, delta: number): void {
    const s = this.states.get(nodeId);
    if (!s) return;

    s.unprocessedBacklog = Math.max(0, s.unprocessedBacklog + delta);
  }

  public getSnapshot(nodeId: string): ComponentStateSnapshot {
    const s = this.states.get(nodeId);
    if (!s) {
      return {
        nodeId,
        state: "unknown",
        activeFailures: [],
        isCircuitOpen: false,
        activeReplicas: 0,
        latencyMultiplier: 1.0,
      };
    }

    return {
      nodeId,
      state: this.getDerivedState(nodeId),
      activeFailures: Array.from(s.activeFailures),
      isCircuitOpen: s.isCircuitOpen,
      activeReplicas: s.activeReplicas,
      latencyMultiplier: s.latencyMultiplier,
      unprocessedBacklog: s.unprocessedBacklog,
      reason: s.reason,
    };
  }

  public getAllSnapshots(): Record<string, ComponentStateSnapshot> {
    const map: Record<string, ComponentStateSnapshot> = {};
    for (const [nodeId] of this.states) {
      map[nodeId] = this.getSnapshot(nodeId);
    }
    return map;
  }
}
