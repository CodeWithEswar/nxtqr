/**
 * NXTQR — Phase 05.3.23: Architecture Database Design, Query Performance & Storage Intelligence Engine
 * PostgreSQL Query Execution Plan JSON Parser
 */

import type {
  QueryExecutionPlan,
  QueryPlanOperator,
  QueryPlanOperatorType,
  DatabaseStateProvenance,
} from "../contracts/database.types";

export interface PostgresPlanRawNode {
  "Node Type": string;
  "Relation Name"?: string;
  "Index Name"?: string;
  "Startup Cost"?: number;
  "Total Cost"?: number;
  "Plan Rows"?: number;
  "Plan Width"?: number;
  "Actual Startup Time"?: number;
  "Actual Total Time"?: number;
  "Actual Rows"?: number;
  "Actual Loops"?: number;
  "Shared Hit Blocks"?: number;
  "Shared Read Blocks"?: number;
  "Filter"?: string;
  "Index Cond"?: string;
  "Plans"?: PostgresPlanRawNode[];
}

export interface PostgresPlanRawRoot {
  Plan: PostgresPlanRawNode;
  "Planning Time"?: number;
  "Execution Time"?: number;
}

export class PostgresPlanParser {
  public static parse(
    jsonInput: string | object,
    queryWorkloadId: string,
    provenance?: DatabaseStateProvenance
  ): QueryExecutionPlan {
    const prov: DatabaseStateProvenance = provenance || {
      source: "observed_performance",
      sourceIdentifier: "postgres_plan_parser",
      timestamp: new Date().toISOString(),
      graphRevision: "rev-plan",
      confirmed: true,
    };

    let raw: unknown = jsonInput;
    if (typeof jsonInput === "string") {
      try {
        raw = JSON.parse(jsonInput);
      } catch (err: unknown) {
        return this.createFallbackPlan(queryWorkloadId, prov, [`Invalid JSON: ${(err as Error).message}`]);
      }
    }

    let rootNode: PostgresPlanRawNode | null = null;
    let planningTime: number | undefined;
    let executionTime: number | undefined;

    if (Array.isArray(raw) && raw.length > 0) {
      const first = raw[0] as PostgresPlanRawRoot;
      rootNode = first.Plan;
      planningTime = first["Planning Time"];
      executionTime = first["Execution Time"];
    } else if (raw && typeof raw === "object" && "Plan" in raw) {
      const root = raw as PostgresPlanRawRoot;
      rootNode = root.Plan;
      planningTime = root["Planning Time"];
      executionTime = root["Execution Time"];
    } else if (raw && typeof raw === "object" && "Node Type" in raw) {
      rootNode = raw as PostgresPlanRawNode;
    }

    if (!rootNode) {
      return this.createFallbackPlan(queryWorkloadId, prov, ["No valid root 'Plan' object found in input."]);
    }

    let operatorCounter = 0;
    const isActual = rootNode["Actual Total Time"] !== undefined;
    const warnings: string[] = [];

    const parsedRoot = this.parseNode(rootNode, () => `op-${++operatorCounter}`, warnings);

    return {
      id: `plan-${queryWorkloadId}-${Date.now()}`,
      queryWorkloadId,
      format: "postgres_json",
      isActualExecution: isActual,
      planningTimeMs: planningTime,
      totalExecutionTimeMs: executionTime,
      rootOperator: parsedRoot,
      warnings,
      provenance: {
        ...prov,
        source: isActual ? "observed_performance" : "modeled_performance",
      },
    };
  }

  private static parseNode(
    node: PostgresPlanRawNode,
    idGen: () => string,
    warnings: string[]
  ): QueryPlanOperator {
    const rawType = (node["Node Type"] || "custom").toLowerCase();
    const operatorType = this.mapOperatorType(rawType);

    const children: QueryPlanOperator[] = [];
    if (Array.isArray(node.Plans)) {
      for (const child of node.Plans) {
        children.push(this.parseNode(child, idGen, warnings));
      }
    }

    return {
      id: idGen(),
      operatorType,
      targetTableName: node["Relation Name"],
      indexName: node["Index Name"],
      estimatedStartupCost: node["Startup Cost"] ?? 0,
      estimatedTotalCost: node["Total Cost"] ?? 0,
      estimatedRows: node["Plan Rows"] ?? 1,
      actualStartupTimeMs: node["Actual Startup Time"],
      actualTotalTimeMs: node["Actual Total Time"],
      actualRows: node["Actual Rows"],
      actualLoops: node["Actual Loops"],
      sharedHitBlocks: node["Shared Hit Blocks"],
      sharedReadBlocks: node["Shared Read Blocks"],
      filterPredicate: node["Filter"],
      indexCondition: node["Index Cond"],
      children,
    };
  }

  private static mapOperatorType(raw: string): QueryPlanOperatorType {
    if (raw.includes("seq scan")) {
      return raw.includes("parallel") ? "parallel_seq_scan" : "seq_scan";
    }
    if (raw.includes("index only scan")) return "index_only_scan";
    if (raw.includes("bitmap index scan")) return "bitmap_index_scan";
    if (raw.includes("bitmap heap scan")) return "bitmap_heap_scan";
    if (raw.includes("index scan")) return "index_scan";
    if (raw.includes("nested loop")) return "nested_loop";
    if (raw.includes("hash join")) return "hash_join";
    if (raw.includes("merge join")) return "merge_join";
    if (raw.includes("sort")) return "sort";
    if (raw.includes("aggregate")) return "aggregate";
    if (raw.includes("materialize")) return "materialize";
    if (raw.includes("limit")) return "limit";
    return "custom";
  }

  private static createFallbackPlan(
    queryWorkloadId: string,
    provenance: DatabaseStateProvenance,
    warnings: string[]
  ): QueryExecutionPlan {
    return {
      id: `plan-fallback-${Date.now()}`,
      queryWorkloadId,
      format: "postgres_json",
      isActualExecution: false,
      rootOperator: {
        id: "op-fallback-1",
        operatorType: "custom",
        estimatedStartupCost: 0,
        estimatedTotalCost: 0,
        estimatedRows: 0,
        children: [],
      },
      warnings,
      provenance,
    };
  }
}
