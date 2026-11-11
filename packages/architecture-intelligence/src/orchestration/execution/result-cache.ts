/**
 * NXTQR — Phase 05.3.29: Architecture Intelligence Orchestration & Unified Analysis Engine
 * Deterministic Tenant-Isolated Analysis Result Cache
 */

import type { AnalyzerResultEnvelope } from "../contracts/orchestration.types";

export interface CacheKeyParams {
  projectId: string;
  revisionHash: string;
  analyzerId: string;
  analyzerVersion: string;
}

export class AnalysisResultCache {
  private cache = new Map<string, AnalyzerResultEnvelope>();

  public static buildKey(params: CacheKeyParams): string {
    return `${params.projectId}:${params.revisionHash}:${params.analyzerId}:${params.analyzerVersion}`;
  }

  public get(params: CacheKeyParams): AnalyzerResultEnvelope | undefined {
    const key = AnalysisResultCache.buildKey(params);
    return this.cache.get(key);
  }

  public set(params: CacheKeyParams, envelope: AnalyzerResultEnvelope): void {
    const key = AnalysisResultCache.buildKey(params);
    this.cache.set(key, envelope);
  }

  public has(params: CacheKeyParams): boolean {
    const key = AnalysisResultCache.buildKey(params);
    return this.cache.has(key);
  }

  public invalidate(analyzerId: string, projectId?: string): void {
    for (const key of this.cache.keys()) {
      const parts = key.split(":");
      const matchesProj = !projectId || parts[0] === projectId;
      const matchesAnalyzer = parts[2] === analyzerId;
      if (matchesProj && matchesAnalyzer) {
        this.cache.delete(key);
      }
    }
  }

  public invalidateRevision(projectId: string, revisionHash: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${projectId}:${revisionHash}:`)) {
        this.cache.delete(key);
      }
    }
  }

  public clear(): void {
    this.cache.clear();
  }

  public get size(): number {
    return this.cache.size;
  }
}

export const analysisResultCache = new AnalysisResultCache();
