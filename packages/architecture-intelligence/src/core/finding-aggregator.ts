import type { HealthFinding, HealthSeverity } from "../contracts/health.types";

const SEVERITY_ORDER: Record<HealthSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

export class FindingAggregator {
  private readonly findingsMap = new Map<string, HealthFinding>();

  public add(finding: HealthFinding): void {
    if (!this.findingsMap.has(finding.id)) {
      this.findingsMap.set(finding.id, finding);
    } else {
      // Merge affected nodes/edges if an existing finding with the same identity exists
      const existing = this.findingsMap.get(finding.id)!;
      const combinedNodes = Array.from(
        new Set([...existing.affectedNodeIds, ...finding.affectedNodeIds])
      );
      const combinedEdges = Array.from(
        new Set([...existing.affectedEdgeIds, ...finding.affectedEdgeIds])
      );
      this.findingsMap.set(finding.id, {
        ...existing,
        affectedNodeIds: combinedNodes,
        affectedEdgeIds: combinedEdges,
      });
    }
  }

  public addMany(findings: HealthFinding[]): void {
    for (const f of findings) {
      this.add(f);
    }
  }

  public getSortedFindings(): HealthFinding[] {
    return Array.from(this.findingsMap.values()).sort((a, b) => {
      const sevDiff = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
      if (sevDiff !== 0) return sevDiff;
      return a.id.localeCompare(b.id);
    });
  }

  public getFindingsByNode(): Record<string, HealthFinding[]> {
    const result: Record<string, HealthFinding[]> = {};
    for (const finding of this.findingsMap.values()) {
      for (const nodeId of finding.affectedNodeIds) {
        if (!result[nodeId]) result[nodeId] = [];
        result[nodeId].push(finding);
      }
    }
    return result;
  }

  public getFindingsByEdge(): Record<string, HealthFinding[]> {
    const result: Record<string, HealthFinding[]> = {};
    for (const finding of this.findingsMap.values()) {
      for (const edgeId of finding.affectedEdgeIds) {
        if (!result[edgeId]) result[edgeId] = [];
        result[edgeId].push(finding);
      }
    }
    return result;
  }
}
