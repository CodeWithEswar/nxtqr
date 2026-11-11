/**
 * NXTQR — Phase 05.3.29: Architecture Intelligence Orchestration & Unified Analysis Engine
 * Centralized Architecture Analyzer Registry
 */

import type {
  AnalyzerDefinition,
  ArchitectureAnalyzer,
  AnalyzerCategory,
} from "../contracts/orchestration.types";

export class AnalyzerRegistry {
  private analyzers = new Map<string, ArchitectureAnalyzer>();

  /**
   * Registers a trusted ArchitectureAnalyzer with definition validation.
   */
  public register(analyzer: ArchitectureAnalyzer): void {
    if (!analyzer.definition || !analyzer.definition.id) {
      throw new Error("Cannot register analyzer without a valid definition ID.");
    }
    this.analyzers.set(analyzer.definition.id, analyzer);
  }

  public get(id: string): ArchitectureAnalyzer | undefined {
    return this.analyzers.get(id);
  }

  public has(id: string): boolean {
    return this.analyzers.has(id);
  }

  public getAll(): ArchitectureAnalyzer[] {
    return Array.from(this.analyzers.values());
  }

  public getAllDefinitions(): AnalyzerDefinition[] {
    return Array.from(this.analyzers.values()).map((a) => a.definition);
  }

  public getByCategory(category: AnalyzerCategory): ArchitectureAnalyzer[] {
    return this.getAll().filter((a) => a.definition.category === category);
  }

  public clear(): void {
    this.analyzers.clear();
  }
}

export const analyzerRegistry = new AnalyzerRegistry();
