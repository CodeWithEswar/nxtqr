import type {
  CachingStrategy,
} from "../cache-schemas";
import { SAMPLE_DATABASE_FIXTURES } from "../../database/database-presets";

export interface DatabaseLookupResult {
  found: boolean;
  value?: unknown;
  sourceTable?: string;
  sourceKey?: string;
}

export class BackingDatabaseAdapter {
  private fixtures: Record<string, import("../../database/database-schemas").DatabaseRow[]>;

  constructor(customFixtures?: Record<string, import("../../database/database-schemas").DatabaseRow[]>) {
    this.fixtures = customFixtures || JSON.parse(JSON.stringify(SAMPLE_DATABASE_FIXTURES));
  }

  /**
   * Resolves a cache key against database fixtures (e.g. "products:42" or "orders:1001").
   */
  public query(key: string): DatabaseLookupResult {
    let tableName = "products";
    let idStr = key;

    if (key.includes(":")) {
      const parts = key.split(":");
      tableName = parts[0];
      idStr = parts[1];
    } else if (key.includes("/")) {
      const parts = key.split("/");
      tableName = parts[parts.length - 2] || "products";
      idStr = parts[parts.length - 1];
    }

    const rows = this.fixtures[tableName] || [];
    const numId = Number(idStr);
    const row = rows.find((r) => r.id === (isNaN(numId) ? idStr : numId));

    if (row) {
      return {
        found: true,
        value: { ...row },
        sourceTable: tableName,
        sourceKey: idStr,
      };
    }

    return { found: false };
  }

  /**
   * Writes/updates a record in the modeled database.
   */
  public write(key: string, value: unknown): boolean {
    let tableName = "products";
    let idStr = key;

    if (key.includes(":")) {
      const parts = key.split(":");
      tableName = parts[0];
      idStr = parts[1];
    }

    if (!this.fixtures[tableName]) {
      this.fixtures[tableName] = [];
    }

    const numId = Number(idStr);
    const idVal = isNaN(numId) ? idStr : numId;
    const existingIndex = this.fixtures[tableName].findIndex((r) => r.id === idVal);

    const rowObj: import("../../database/database-schemas").DatabaseRow =
      typeof value === "object" && value !== null
        ? { id: idVal, ...(value as Record<string, unknown>) }
        : { id: idVal, val: value };

    if (existingIndex >= 0) {
      this.fixtures[tableName][existingIndex] = rowObj;
    } else {
      this.fixtures[tableName].push(rowObj);
    }

    return true;
  }
}

export interface StrategyExecutionPlan {
  strategy: CachingStrategy;
  requiresDatabaseRead: boolean;
  requiresDatabaseWrite: boolean;
  deferredWrite: boolean;
  description: string;
}

export class CacheStrategyPlanner {
  public static planGet(strategy: CachingStrategy, isCacheHit: boolean): StrategyExecutionPlan {
    switch (strategy) {
      case "cache_aside":
        return {
          strategy: "cache_aside",
          requiresDatabaseRead: !isCacheHit,
          requiresDatabaseWrite: false,
          deferredWrite: false,
          description: isCacheHit
            ? "Cache-Aside: Hit! Served directly from memory."
            : "Cache-Aside: Miss! Application queries backing database fixture, then populates cache.",
        };
      case "read_through":
        return {
          strategy: "read_through",
          requiresDatabaseRead: !isCacheHit,
          requiresDatabaseWrite: false,
          deferredWrite: false,
          description: isCacheHit
            ? "Read-Through: Hit! Cache returns entry transparently."
            : "Read-Through: Miss! Cache proxy loads from database fixture and caches before returning.",
        };
      default:
        return {
          strategy,
          requiresDatabaseRead: !isCacheHit,
          requiresDatabaseWrite: false,
          deferredWrite: false,
          description: `${strategy}: Read operation evaluated.`,
        };
    }
  }

  public static planSet(strategy: CachingStrategy): StrategyExecutionPlan {
    switch (strategy) {
      case "cache_aside":
        return {
          strategy: "cache_aside",
          requiresDatabaseRead: false,
          requiresDatabaseWrite: true,
          deferredWrite: false,
          description: "Cache-Aside Write: Application updates DB and invalidates/updates cache.",
        };
      case "write_through":
        return {
          strategy: "write_through",
          requiresDatabaseRead: false,
          requiresDatabaseWrite: true,
          deferredWrite: false,
          description: "Write-Through: Synchronous coordinated write to both cache and database.",
        };
      case "write_behind":
        return {
          strategy: "write_behind",
          requiresDatabaseRead: false,
          requiresDatabaseWrite: false,
          deferredWrite: true,
          description: "Write-Behind: Written to cache immediately; queued for deferred asynchronous database flush.",
        };
      default:
        return {
          strategy,
          requiresDatabaseRead: false,
          requiresDatabaseWrite: false,
          deferredWrite: false,
          description: `${strategy}: Write operation executed.`,
        };
    }
  }
}
