import type {
  PriorityClass,
  QueueSchedulingPolicy,
  SyntheticRequestRuntime,
} from "../traffic-control-schemas";

export interface QueuedEntry {
  req: SyntheticRequestRuntime;
  enqueuedAtMs: number;
  tenantWeight: number;
  virtualFinishScore: number;
}

const PRIORITY_RANK: Record<PriorityClass, number> = {
  critical: 3,
  standard: 2,
  background: 1,
};

export class BoundedQueueScheduler {
  private entries: QueuedEntry[] = [];
  private wfqTenantClock: Record<string, number> = {};

  constructor(
    private readonly capacity: number,
    private readonly policy: QueueSchedulingPolicy,
    private readonly maxWaitMs: number,
    private readonly agingBoostMs: number
  ) {}

  public size(): number {
    return this.entries.length;
  }

  public snapshotItems() {
    return this.entries.map((e) => ({
      id: e.req.id,
      tenantId: e.req.tenantId,
      priority: e.req.priority,
      enqueuedAtMs: e.enqueuedAtMs,
      deadlineMs: e.req.deadlineMs,
    }));
  }

  public enqueue(
    req: SyntheticRequestRuntime,
    nowMs: number,
    tenantWeight: number
  ): { ok: boolean; reason: string } {
    if (this.entries.length >= this.capacity) {
      return {
        ok: false,
        reason: `Bounded queue full (${this.entries.length}/${this.capacity})`,
      };
    }

    const prevFinish = this.wfqTenantClock[req.tenantId] ?? nowMs;
    const startTag = Math.max(nowMs, prevFinish);
    const finishTag = startTag + (req.cost * 100) / Math.max(1, tenantWeight);
    this.wfqTenantClock[req.tenantId] = finishTag;

    req.enqueuedAtMs = nowMs;
    req.state = "QUEUED";

    this.entries.push({
      req,
      enqueuedAtMs: nowMs,
      tenantWeight,
      virtualFinishScore: finishTag,
    });

    return {
      ok: true,
      reason: `Enqueued under ${this.policy} (depth=${this.entries.length}/${this.capacity})`,
    };
  }

  public purgeExpired(nowMs: number): SyntheticRequestRuntime[] {
    const expired: SyntheticRequestRuntime[] = [];
    const surviving: QueuedEntry[] = [];
    for (const entry of this.entries) {
      const waited = nowMs - entry.enqueuedAtMs;
      const pastMaxWait = waited > this.maxWaitMs;
      const pastDeadline =
        entry.req.deadlineMs !== undefined && nowMs > entry.req.deadlineMs;
      if (pastMaxWait || pastDeadline) {
        expired.push(entry.req);
      } else {
        surviving.push(entry);
      }
    }
    this.entries = surviving;
    return expired;
  }

  public cancelOne(predicate?: (req: SyntheticRequestRuntime) => boolean): SyntheticRequestRuntime | null {
    const idx = predicate
      ? this.entries.findIndex((e) => predicate(e.req))
      : this.entries.length - 1;
    if (idx < 0) return null;
    const [removed] = this.entries.splice(idx, 1);
    return removed?.req ?? null;
  }

  public dequeueNext(nowMs: number): QueuedEntry | null {
    if (this.entries.length === 0) return null;

    let bestIdx = 0;

    if (this.policy === "fifo") {
      bestIdx = 0;
    } else if (this.policy === "priority") {
      let bestScore = -1;
      for (let i = 0; i < this.entries.length; i++) {
        const e = this.entries[i]!;
        const ageBonus = Math.floor((nowMs - e.enqueuedAtMs) / this.agingBoostMs);
        const score = PRIORITY_RANK[e.req.priority] * 10 + ageBonus;
        if (score > bestScore) {
          bestScore = score;
          bestIdx = i;
        }
      }
    } else if (this.policy === "wfq") {
      let minTag = Infinity;
      for (let i = 0; i < this.entries.length; i++) {
        const e = this.entries[i]!;
        if (e.virtualFinishScore < minTag) {
          minTag = e.virtualFinishScore;
          bestIdx = i;
        }
      }
    } else if (this.policy === "edf") {
      let minDeadline = Infinity;
      for (let i = 0; i < this.entries.length; i++) {
        const e = this.entries[i]!;
        const dl = e.req.deadlineMs ?? e.enqueuedAtMs + this.maxWaitMs;
        if (dl < minDeadline) {
          minDeadline = dl;
          bestIdx = i;
        }
      }
    }

    const [picked] = this.entries.splice(bestIdx, 1);
    return picked ?? null;
  }
}

