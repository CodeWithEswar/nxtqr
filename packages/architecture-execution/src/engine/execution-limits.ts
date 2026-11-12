import type { ExecutionLimits } from "../schemas/execution.schemas";

export interface CycleCheckResult {
  hasCycle: boolean;
  cycleNodeId?: string;
  visitCount?: number;
}

export class ExecutionLimitsGuard {
  private visitedNodes = new Map<string, number>();
  private hopCount = 0;
  private eventCount = 0;

  constructor(private limits: ExecutionLimits) {}

  public recordHop(nodeId: string): void {
    this.hopCount++;
    const count = this.visitedNodes.get(nodeId) || 0;
    this.visitedNodes.set(nodeId, count + 1);
  }

  public recordEvent(): void {
    this.eventCount++;
  }

  public isHopLimitReached(): boolean {
    return this.hopCount >= this.limits.maxHops;
  }

  public isEventLimitReached(): boolean {
    return this.eventCount >= this.limits.maxEvents;
  }

  public checkCycle(nodeId: string, maxVisitsPerNode = 4): CycleCheckResult {
    const visits = (this.visitedNodes.get(nodeId) || 0) + 1;
    if (visits > maxVisitsPerNode) {
      return {
        hasCycle: true,
        cycleNodeId: nodeId,
        visitCount: visits,
      };
    }
    return { hasCycle: false };
  }

  public getHopCount(): number {
    return this.hopCount;
  }

  public getEventCount(): number {
    return this.eventCount;
  }
}

