import type { FieldDelta } from "../contracts/comparison.types";

export class ConfigurationDiff {
  public static diffConfigs(
    baselineConfig: Record<string, unknown> = {},
    candidateConfig: Record<string, unknown> = {}
  ): {
    changedFields: string[];
    fieldDeltas: FieldDelta[];
  } {
    const allKeys = Array.from(
      new Set([...Object.keys(baselineConfig || {}), ...Object.keys(candidateConfig || {})])
    ).sort();

    const changedFields: string[] = [];
    const fieldDeltas: FieldDelta[] = [];

    // Fields to exclude from semantic configuration diff (visual or ephemeral)
    const ignoredKeys = new Set([
      "x",
      "y",
      "position",
      "dimensions",
      "width",
      "height",
      "selected",
      "dragging",
      "zIndex",
      "timestamp",
    ]);

    for (const key of allKeys) {
      if (ignoredKeys.has(key)) continue;

      const rawBase = baselineConfig[key];
      const rawCand = candidateConfig[key];

      const normBase = this.normalizeValue(key, rawBase);
      const normCand = this.normalizeValue(key, rawCand);

      if (!this.areValuesEqual(normBase.value, normCand.value)) {
        changedFields.push(key);
        fieldDeltas.push({
          fieldPath: key,
          baselineValue: rawBase,
          candidateValue: rawCand,
          unit: normBase.unit || normCand.unit,
          isNormalized: normBase.isNormalized || normCand.isNormalized,
        });
      }
    }

    return { changedFields, fieldDeltas };
  }

  private static normalizeValue(
    key: string,
    val: unknown
  ): { value: unknown; unit?: string; isNormalized?: boolean } {
    if (val === undefined || val === null) {
      return { value: undefined };
    }

    const lowerKey = key.toLowerCase();

    // 1. Time / Latency / Timeout Normalization (standardize to ms)
    if (lowerKey.includes("timeout") || lowerKey.includes("latency") || lowerKey.includes("ttl")) {
      if (typeof val === "number") {
        if (lowerKey.endsWith("seconds") || lowerKey.endsWith("sec") || lowerKey === "ttlseconds") {
          return { value: val * 1000, unit: "ms", isNormalized: true };
        }
        if (lowerKey.endsWith("ms") || lowerKey.endsWith("millis")) {
          return { value: val, unit: "ms", isNormalized: true };
        }
      }
    }

    // 2. Memory / Storage Normalization (standardize to MB)
    if (lowerKey.includes("memory") || lowerKey.includes("storage") || lowerKey.includes("capacity")) {
      if (typeof val === "number") {
        if (lowerKey.endsWith("gb")) {
          return { value: val * 1024, unit: "MB", isNormalized: true };
        }
        if (lowerKey.endsWith("mb")) {
          return { value: val, unit: "MB", isNormalized: true };
        }
      }
    }

    // 3. Throughput / RPS Normalization
    if (lowerKey.includes("rps") || lowerKey.includes("qps") || lowerKey.includes("throughput")) {
      if (typeof val === "number") {
        return { value: val, unit: "req/s", isNormalized: true };
      }
    }

    // 4. Boolean string representations ("true", "false", 1, 0)
    if (typeof val === "string") {
      const trimmed = val.trim().toLowerCase();
      if (trimmed === "true") return { value: true, isNormalized: true };
      if (trimmed === "false") return { value: false, isNormalized: true };
      // Numeric strings
      const num = Number(trimmed);
      if (!Number.isNaN(num) && trimmed !== "") {
        return { value: num, isNormalized: true };
      }
    }

    return { value: val };
  }

  private static areValuesEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a === undefined && b === undefined) return true;
    if (a === null && b === null) return true;
    if (a === undefined || b === undefined) return false;
    if (a === null || b === null) return false;

    if (typeof a === "object" && typeof b === "object") {
      return JSON.stringify(a) === JSON.stringify(b);
    }

    return false;
  }
}

