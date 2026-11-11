import { describe, it, expect } from "vitest";
import { QueryFingerprinter } from "../database/query/query-fingerprinter";
import { PostgresPlanParser } from "../database/parsers/postgres-plan-parser";
import { QueryPlanAnalyzer } from "../database/analysis/query-plan-analyzer";
import type { QueryExecutionPlan } from "../database/contracts/database.types";

describe("Phase 05.3.23: Query Fingerprinter, Plan Parser & Plan Analyzer", () => {
  const now = new Date().toISOString();

  it("should generate deterministic query fingerprints and stable hashes", () => {
    const query1 = "SELECT id, email FROM users WHERE id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' AND status = 'active';";
    const query2 = "select  id,  email  from  users  where  id = $1 and status = 'pending';";

    const fp1 = QueryFingerprinter.generateFingerprint(query1);
    const fp2 = QueryFingerprinter.generateFingerprint(query2);

    expect(fp1.normalizedSql).toBe("select id, email from users where id = ? and status = ?;");
    expect(fp2.normalizedSql).toBe("select id, email from users where id = ? and status = ?;");
    expect(fp1.fingerprintHash).toBe(fp2.fingerprintHash);
  });

  it("should parse PostgreSQL EXPLAIN JSON into recursive operator trees distinguishing estimated and actual metrics", () => {
    const explainJson = [
      {
        Plan: {
          "Node Type": "Nested Loop",
          "Parallel Aware": false,
          "Startup Cost": 0.57,
          "Total Cost": 12450.8,
          "Plan Rows": 100,
          "Plan Width": 64,
          "Actual Startup Time": 0.052,
          "Actual Total Time": 142.6,
          "Actual Rows": 12500, // 125x estimation mismatch!
          "Actual Loops": 1,
          "Shared Hit Blocks": 850,
          "Shared Read Blocks": 420,
          Plans: [
            {
              "Node Type": "Seq Scan",
              "Parent Relationship": "Outer",
              "Relation Name": "large_orders",
              "Startup Cost": 0.0,
              "Total Cost": 8450.0,
              "Plan Rows": 850000,
              "Actual Startup Time": 0.015,
              "Actual Total Time": 110.2,
              "Actual Rows": 850000,
              "Actual Loops": 1,
              Filter: "(status = 'FAILED'::text)",
            },
            {
              "Node Type": "Index Scan",
              "Parent Relationship": "Inner",
              "Relation Name": "users",
              "Index Name": "users_pkey",
              "Startup Cost": 0.42,
              "Total Cost": 8.44,
              "Plan Rows": 1,
              "Actual Startup Time": 0.001,
              "Actual Total Time": 0.002,
              "Actual Rows": 1,
              "Actual Loops": 12500,
              "Index Cond": "(id = large_orders.user_id)",
            },
          ],
        },
        Planning: {
          "Shared Hit Blocks": 12,
        },
        "Planning Time": 0.485,
        "Execution Time": 145.2,
      },
    ];

    const plan = PostgresPlanParser.parse(explainJson, "workload-1", {
      source: "observed_performance",
      timestamp: now,
      graphRevision: "rev-1",
      confirmed: true,
    });

    expect(plan.format).toBe("postgres_json");
    expect(plan.isActualExecution).toBe(true);
    expect(plan.totalExecutionTimeMs).toBe(145.2);
    expect(plan.planningTimeMs).toBe(0.485);
    expect(plan.rootOperator.operatorType).toBe("nested_loop");
    expect(plan.rootOperator.children.length).toBe(2);
    expect(plan.rootOperator.children[0].operatorType).toBe("seq_scan");
    expect(plan.rootOperator.children[0].targetTableName).toBe("large_orders");
    expect(plan.rootOperator.children[1].operatorType).toBe("index_scan");
    expect(plan.rootOperator.children[1].indexName).toBe("users_pkey");
  });

  it("should detect expensive sequential scans and cardinality estimation mismatches", () => {
    const plans: QueryExecutionPlan[] = [
      {
        id: "plan-bad-seq-scan",
        queryWorkloadId: "workload-audit",
        format: "postgres_json",
        isActualExecution: true,
        totalExecutionTimeMs: 250.0,
        planningTimeMs: 0.5,
        warnings: [],
        provenance: {
          source: "observed_performance",
          timestamp: now,
          graphRevision: "rev-1",
          confirmed: true,
        },
        rootOperator: {
          id: "op-1",
          operatorType: "seq_scan",
          targetTableName: "audit_events",
          estimatedStartupCost: 0,
          estimatedTotalCost: 15000,
          estimatedRows: 50, // Planner estimated 50 rows
          actualStartupTimeMs: 0.1,
          actualTotalTimeMs: 245.0,
          actualRows: 250000, // Actual rows 250,000 -> 5,000x mismatch!
          actualLoops: 1,
          filterPredicate: "created_at > NOW() - INTERVAL '30 days'",
          children: [],
        },
      },
    ];

    const findings = QueryPlanAnalyzer.analyze(plans);
    expect(findings.length).toBeGreaterThanOrEqual(2);

    const seqScanFinding = findings.find((f) => f.category === "unbounded_table_scan");
    expect(seqScanFinding).toBeDefined();
    expect(seqScanFinding?.severity).toBe("high");
    expect(seqScanFinding?.explanation).toContain("audit_events");

    const mismatchFinding = findings.find((f) => f.category === "cardinality_estimation_mismatch");
    expect(mismatchFinding).toBeDefined();
    expect(mismatchFinding?.explanation).toContain("estimated 50 rows");
    expect(mismatchFinding?.remediation).toContain("ANALYZE");
  });
});
