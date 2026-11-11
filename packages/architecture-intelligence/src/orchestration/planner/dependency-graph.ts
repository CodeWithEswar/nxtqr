/**
 * NXTQR — Phase 05.3.29: Architecture Intelligence Orchestration & Unified Analysis Engine
 * Dependency Graph Model & Topological Resolver
 */

import type { AnalyzerDefinition } from "../contracts/orchestration.types";
import { DependencyCycleDetector, type CycleDetectionResult } from "./cycle-detector";

export class AnalyzerDependencyGraph {
  private definitions = new Map<string, AnalyzerDefinition>();
  private dependencies = new Map<string, Set<string>>(); // analyzer -> dependencies it requires
  private dependents = new Map<string, Set<string>>(); // dependency -> analyzers that depend on it

  constructor(definitions: AnalyzerDefinition[] = []) {
    for (const def of definitions) {
      this.addAnalyzer(def);
    }
  }

  public addAnalyzer(def: AnalyzerDefinition): void {
    this.definitions.set(def.id, def);
    if (!this.dependencies.has(def.id)) {
      this.dependencies.set(def.id, new Set());
    }
    if (!this.dependents.has(def.id)) {
      this.dependents.set(def.id, new Set());
    }

    for (const depId of def.dependencies) {
      this.dependencies.get(def.id)!.add(depId);
      if (!this.dependents.has(depId)) {
        this.dependents.set(depId, new Set());
      }
      this.dependents.get(depId)!.add(def.id);
    }
  }

  public getDefinition(id: string): AnalyzerDefinition | undefined {
    return this.definitions.get(id);
  }

  public getDirectDependencies(id: string): string[] {
    return Array.from(this.dependencies.get(id) || []);
  }

  public getDirectDependents(id: string): string[] {
    return Array.from(this.dependents.get(id) || []);
  }

  public detectCycles(): CycleDetectionResult {
    const adjacency = new Map<string, string[]>();
    for (const [id, deps] of this.dependencies.entries()) {
      adjacency.set(id, Array.from(deps));
    }
    return DependencyCycleDetector.detectCycles(adjacency);
  }

  /**
   * Given a set of requested analyzer IDs, transitively resolves all upstream analyzers required.
   */
  public resolveTransitiveDependencies(requestedIds: string[]): Set<string> {
    const resolved = new Set<string>();
    const queue = [...requestedIds];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (!resolved.has(current)) {
        resolved.add(current);
        const deps = this.dependencies.get(current) || new Set();
        for (const dep of deps) {
          if (!resolved.has(dep)) {
            queue.push(dep);
          }
        }
      }
    }

    return resolved;
  }

  /**
   * Returns all downstream dependents that transitively depend on the given analyzer ID.
   */
  public resolveTransitiveDependents(analyzerId: string): Set<string> {
    const affected = new Set<string>();
    const queue = [analyzerId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const dependents = this.dependents.get(current) || new Set();
      for (const dep of dependents) {
        if (!affected.has(dep)) {
          affected.add(dep);
          queue.push(dep);
        }
      }
    }

    return affected;
  }

  /**
   * Computes topological ordering for a subset of analyzers (or all if not specified).
   * Upstream dependencies come before downstream dependents.
   */
  public getTopologicalOrder(subsetIds?: string[]): string[] {
    const cycleCheck = this.detectCycles();
    if (cycleCheck.hasCycles) {
      throw new Error(
        `Cannot compute topological order: Cycle detected in analyzer dependency graph: ${cycleCheck.cyclePath?.join(
          " -> "
        )}`
      );
    }

    const targetSet = subsetIds ? new Set(subsetIds) : new Set(this.definitions.keys());
    const inDegree = new Map<string, number>();

    for (const id of targetSet) {
      const deps = this.dependencies.get(id) || new Set();
      // Count in-degrees only within the targetSet
      let count = 0;
      for (const dep of deps) {
        if (targetSet.has(dep)) {
          count++;
        }
      }
      inDegree.set(id, count);
    }

    const queue: string[] = [];
    for (const [id, deg] of inDegree.entries()) {
      if (deg === 0) {
        queue.push(id);
      }
    }

    // Sort queue stably for deterministic order
    queue.sort();

    const order: string[] = [];
    while (queue.length > 0) {
      const current = queue.shift()!;
      order.push(current);

      const dependents = this.dependents.get(current) || new Set();
      for (const dep of dependents) {
        if (targetSet.has(dep)) {
          const currentDeg = inDegree.get(dep)! - 1;
          inDegree.set(dep, currentDeg);
          if (currentDeg === 0) {
            queue.push(dep);
            queue.sort();
          }
        }
      }
    }

    if (order.length !== targetSet.size) {
      throw new Error(
        `Topological resolution incomplete. Expected ${targetSet.size} analyzers, resolved ${order.length}.`
      );
    }

    return order;
  }
}
