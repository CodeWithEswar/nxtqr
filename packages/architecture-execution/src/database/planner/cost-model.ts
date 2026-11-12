import type { PlanOperatorCost } from "../database-schemas";

export class CostModel {
  // Constant illustrative cost parameters (modeled units)
  public static readonly COST_PER_SEQ_ROW_VISIT = 1.0;
  public static readonly COST_PER_INDEX_PROBE = 0.25;
  public static readonly COST_PER_ROW_CPU_EVAL = 0.05;
  public static readonly COST_PER_HASH_BUCKET_INSERT = 0.1;
  public static readonly COST_STARTUP_SORT = 2.0;

  public static estimateSeqScanCost(rowCount: number): PlanOperatorCost {
    const startup = 0.0;
    const total = rowCount * this.COST_PER_SEQ_ROW_VISIT + rowCount * this.COST_PER_ROW_CPU_EVAL;
    const durationMs = Math.max(1, Math.round(rowCount * 0.5));

    return {
      startup,
      total: Math.round(total * 100) / 100,
      rowVisits: rowCount,
      indexProbes: 0,
      comparisons: rowCount,
      modeledDurationMs: durationMs,
    };
  }

  public static estimateIndexScanCost(_totalRows: number, estimatedMatches: number): PlanOperatorCost {
    const startup = 0.5; // Index root & tree branch descent
    const indexProbes = 1;
    const rowVisits = Math.max(1, estimatedMatches);
    const total = startup + indexProbes * this.COST_PER_INDEX_PROBE + rowVisits * this.COST_PER_ROW_CPU_EVAL;
    const durationMs = Math.max(1, Math.round(1 + estimatedMatches * 0.1));

    return {
      startup,
      total: Math.round(total * 100) / 100,
      rowVisits,
      indexProbes,
      comparisons: 1,
      modeledDurationMs: durationMs,
    };
  }

  public static estimateJoinCost(
    algorithm: "nested_loop" | "hash",
    outerRows: number,
    innerRows: number
  ): PlanOperatorCost {
    if (algorithm === "nested_loop") {
      const startup = 0.0;
      const comparisons = outerRows * innerRows;
      const total = startup + comparisons * this.COST_PER_ROW_CPU_EVAL;
      const durationMs = Math.max(2, Math.round(comparisons * 0.1));

      return {
        startup,
        total: Math.round(total * 100) / 100,
        rowVisits: outerRows + innerRows,
        indexProbes: 0,
        comparisons,
        modeledDurationMs: durationMs,
      };
    } else {
      // Hash Join
      const startup = innerRows * this.COST_PER_HASH_BUCKET_INSERT;
      const comparisons = outerRows;
      const total = startup + outerRows * this.COST_PER_ROW_CPU_EVAL;
      const durationMs = Math.max(2, Math.round((innerRows + outerRows) * 0.2));

      return {
        startup: Math.round(startup * 100) / 100,
        total: Math.round(total * 100) / 100,
        rowVisits: outerRows + innerRows,
        indexProbes: 0,
        comparisons,
        modeledDurationMs: durationMs,
      };
    }
  }

  public static estimateSortCost(rowCount: number): PlanOperatorCost {
    const startup = this.COST_STARTUP_SORT;
    const comparisons = Math.round(rowCount * Math.log2(Math.max(2, rowCount)));
    const total = startup + comparisons * this.COST_PER_ROW_CPU_EVAL;
    const durationMs = Math.max(1, Math.round(rowCount * 0.3));

    return {
      startup,
      total: Math.round(total * 100) / 100,
      rowVisits: rowCount,
      indexProbes: 0,
      comparisons,
      modeledDurationMs: durationMs,
    };
  }

  public static estimateAggregateCost(rowCount: number): PlanOperatorCost {
    const startup = 0.5;
    const total = startup + rowCount * this.COST_PER_ROW_CPU_EVAL;
    const durationMs = Math.max(1, Math.round(rowCount * 0.2));

    return {
      startup,
      total: Math.round(total * 100) / 100,
      rowVisits: rowCount,
      indexProbes: 0,
      comparisons: rowCount,
      modeledDurationMs: durationMs,
    };
  }
}
