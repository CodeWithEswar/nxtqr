import type {
  CacheEntry,
  CoalescingGroup,
} from "../cache-schemas";

export interface CoalescingResult {
  isLeader: boolean;
  group: CoalescingGroup;
  joinedExisting: boolean;
}

export class RequestCoalescingManager {
  private inFlightGroups: Record<string, CoalescingGroup> = {};

  public requestLoad(
    key: string,
    requestId: string,
    atMs: number
  ): CoalescingResult {
    const existing = this.inFlightGroups[key];
    if (existing && existing.status === "loading") {
      if (!existing.waitingRequestIds.includes(requestId) && existing.leaderRequestId !== requestId) {
        existing.waitingRequestIds.push(requestId);
      }
      return {
        isLeader: false,
        group: { ...existing },
        joinedExisting: true,
      };
    }

    const newGroup: CoalescingGroup = {
      key,
      leaderRequestId: requestId,
      waitingRequestIds: [],
      status: "loading",
      startedAtMs: atMs,
    };
    this.inFlightGroups[key] = newGroup;

    return {
      isLeader: true,
      group: { ...newGroup },
      joinedExisting: false,
    };
  }

  public completeLoad(key: string, sharedValue: unknown): CoalescingGroup | null {
    const group = this.inFlightGroups[key];
    if (!group) return null;

    group.status = "completed";
    group.sharedValue = sharedValue;
    const completed = { ...group };
    delete this.inFlightGroups[key];
    return completed;
  }

  public failLoad(key: string): CoalescingGroup | null {
    const group = this.inFlightGroups[key];
    if (!group) return null;

    group.status = "failed";
    const failed = { ...group };
    delete this.inFlightGroups[key];
    return failed;
  }

  public getInFlightGroups(): Record<string, CoalescingGroup> {
    return { ...this.inFlightGroups };
  }
}

export class InvalidationManager {
  /**
   * Evaluates if a key matches an invalidation pattern (e.g. "products:*" or "users:101").
   */
  public static matchesPattern(key: string, pattern: string): boolean {
    if (pattern === "*" || pattern === key) return true;
    if (pattern.endsWith("*")) {
      const prefix = pattern.slice(0, -1);
      return key.startsWith(prefix);
    }
    return false;
  }

  /**
   * Applies invalidation against cache entries, returning matching keys.
   */
  public static findInvalidationTargets(
    entries: Record<string, CacheEntry>,
    patternOrKey: string
  ): string[] {
    const targets: string[] = [];
    for (const key of Object.keys(entries)) {
      if (this.matchesPattern(key, patternOrKey)) {
        targets.push(key);
      }
    }
    return targets;
  }
}

export class StaleWhileRevalidateChecker {
  /**
   * Checks if an entry is expired but still within the stale-while-revalidate serving window.
   */
  public static isWithinStaleWindow(
    entry: CacheEntry,
    virtualClockMs: number,
    staleWindowMs: number
  ): boolean {
    if (!entry.expiresAtMs) return false;
    const isExpired = virtualClockMs >= entry.expiresAtMs;
    if (!isExpired) return false;

    const timeSinceExpiry = virtualClockMs - entry.expiresAtMs;
    return timeSinceExpiry <= staleWindowMs;
  }
}

