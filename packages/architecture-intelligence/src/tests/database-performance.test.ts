import { describe, it, expect } from "vitest";
import { SqlDdlParser } from "../database/parsers/sql-ddl-parser";
import { QueryFingerprinter } from "../database/query/query-fingerprinter";

describe("Phase 05.3.23: Database Architecture Performance Benchmarks", () => {
  it("should parse 100 table DDL statements within 150ms budget", () => {
    let ddl = "";
    for (let i = 0; i < 100; i++) {
      ddl += `
        CREATE TABLE entity_${i} (
          id UUID PRIMARY KEY,
          tenant_id UUID NOT NULL,
          name VARCHAR(100) NOT NULL,
          created_at TIMESTAMP NOT NULL,
          is_active BOOLEAN NOT NULL DEFAULT true
        );
        CREATE INDEX idx_entity_${i}_tenant ON entity_${i}(tenant_id);
      `;
    }

    const start = performance.now();
    const schema = SqlDdlParser.parse(ddl, {
      source: "declared_design",
      timestamp: new Date().toISOString(),
      graphRevision: "rev-perf",
      confirmed: true,
    });
    const duration = performance.now() - start;

    expect(schema.tables.length).toBe(100);
    expect(duration).toBeLessThan(150); // Under 150ms budget
  });

  it("should fingerprint 1,000 queries within 250ms budget", () => {
    const rawQueries: string[] = [];
    for (let i = 0; i < 1000; i++) {
      rawQueries.push(
        `SELECT col1, col2, col3 FROM table_${i % 10} WHERE id = ${i * 42} AND status = 'STATUS_${i % 5}' AND tenant_id = 'e7b0a880-1a1a-4c22-b2d9-${String(i).padStart(12, "0")}';`
      );
    }

    const start = performance.now();
    for (const q of rawQueries) {
      QueryFingerprinter.generateFingerprint(q);
    }
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(250); // Under 250ms budget
  });
});
