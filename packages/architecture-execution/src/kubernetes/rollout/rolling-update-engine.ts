export class RollingUpdateEngine {
  /**
   * Resolves Kubernetes maxSurge / maxUnavailable specifications (number or "25%").
   * Per Kubernetes semantics, percentage maxSurge rounds UP (Math.ceil),
   * while percentage maxUnavailable rounds DOWN (Math.floor).
   */
  public static resolveSurgeAndUnavailable(
    desiredReplicas: number,
    maxSurge: number | string,
    maxUnavailable: number | string
  ): { maxSurgeCount: number; maxUnavailableCount: number; maxTotalPods: number; minAvailablePods: number } {
    const parseBound = (val: number | string, roundUp: boolean): number => {
      if (typeof val === "number") return Math.max(0, Math.floor(val));
      const trimmed = val.trim();
      if (trimmed.endsWith("%")) {
        const pct = Number.parseFloat(trimmed.slice(0, -1));
        if (!Number.isFinite(pct) || pct <= 0) return 0;
        const raw = (desiredReplicas * pct) / 100;
        return roundUp ? Math.ceil(raw) : Math.floor(raw);
      }
      const num = Number.parseInt(trimmed, 10);
      return Number.isFinite(num) && num >= 0 ? num : 0;
    };

    let maxSurgeCount = parseBound(maxSurge, true);
    const maxUnavailableCount = parseBound(maxUnavailable, false);

    // Prevent deadlock if both resolve to 0 for desired > 0
    if (desiredReplicas > 0 && maxSurgeCount === 0 && maxUnavailableCount === 0) {
      maxSurgeCount = 1;
    }

    return {
      maxSurgeCount,
      maxUnavailableCount,
      maxTotalPods: desiredReplicas + maxSurgeCount,
      minAvailablePods: Math.max(0, desiredReplicas - maxUnavailableCount),
    };
  }
}
