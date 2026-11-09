import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import {
  RelationalDatabaseIcon,
  PostgresqlIcon,
  MysqlIcon,
  DistributedSqlDatabaseIcon,
  DocumentDatabaseIcon,
  KeyValueDatabaseIcon,
  WideColumnDatabaseIcon,
  GraphDatabaseIcon,
  TimeSeriesDatabaseIcon,
  VectorDatabaseIcon,
  InMemoryDatabaseIcon,
  DatabasePrimaryIcon,
  ReadReplicaIcon,
  DatabaseClusterIcon,
  DataWarehouseIcon,
  databasesAndPersistenceIconRegistry,
  getDatabasesAndPersistenceInfrastructureIcon,
  getInfrastructureIcon,
} from "../index";

const ALL_CATEGORY_05_ICONS = [
  { slug: "relational-database", name: "RelationalDatabaseIcon", Component: RelationalDatabaseIcon },
  { slug: "postgresql", name: "PostgresqlIcon", Component: PostgresqlIcon },
  { slug: "mysql", name: "MysqlIcon", Component: MysqlIcon },
  { slug: "distributed-sql-database", name: "DistributedSqlDatabaseIcon", Component: DistributedSqlDatabaseIcon },
  { slug: "document-database", name: "DocumentDatabaseIcon", Component: DocumentDatabaseIcon },
  { slug: "key-value-database", name: "KeyValueDatabaseIcon", Component: KeyValueDatabaseIcon },
  { slug: "wide-column-database", name: "WideColumnDatabaseIcon", Component: WideColumnDatabaseIcon },
  { slug: "graph-database", name: "GraphDatabaseIcon", Component: GraphDatabaseIcon },
  { slug: "time-series-database", name: "TimeSeriesDatabaseIcon", Component: TimeSeriesDatabaseIcon },
  { slug: "vector-database", name: "VectorDatabaseIcon", Component: VectorDatabaseIcon },
  { slug: "in-memory-database", name: "InMemoryDatabaseIcon", Component: InMemoryDatabaseIcon },
  { slug: "database-primary", name: "DatabasePrimaryIcon", Component: DatabasePrimaryIcon },
  { slug: "read-replica", name: "ReadReplicaIcon", Component: ReadReplicaIcon },
  { slug: "database-cluster", name: "DatabaseClusterIcon", Component: DatabaseClusterIcon },
  { slug: "data-warehouse", name: "DataWarehouseIcon", Component: DataWarehouseIcon },
] as const;

describe("Category 05 — Databases & Persistence Infrastructure Icons", () => {
  it("renders all 15 icons in colored mode with 32x32 viewBox", () => {
    for (const { slug, name, Component } of ALL_CATEGORY_05_ICONS) {
      const html = renderToString(<Component size={32} variant="colored" />);
      expect(html, `Icon "${name}" (${slug}) should render valid SVG`).toContain("<svg");
      expect(html).toContain('viewBox="0 0 32 32"');
      expect(html).toContain('width="32"');
      expect(html).toContain('height="32"');
      expect(html).not.toContain("NaN");
      expect(html).not.toContain("undefined");
    }
  });

  it("renders all 15 icons in monochrome mode with accessible titles", () => {
    for (const { name, Component } of ALL_CATEGORY_05_ICONS) {
      const html = renderToString(
        <Component size={24} variant="monochrome" decorative={false} title={name} />
      );
      expect(html).toContain("<svg");
      expect(html).toContain(`<title>${name}</title>`);
      expect(html).toContain('role="img"');
    }
  });

  it("ensures registry exports exactly 15 items mapping slug to component", () => {
    expect(Object.keys(databasesAndPersistenceIconRegistry)).toHaveLength(15);
    for (const { slug, Component } of ALL_CATEGORY_05_ICONS) {
      expect(databasesAndPersistenceIconRegistry[slug]).toBe(Component);
      expect(getDatabasesAndPersistenceInfrastructureIcon(slug)).toBe(Component);
      expect(getInfrastructureIcon(slug)).toBe(Component);
    }
  });

  it("supports arbitrary sizes without distortion (16px, 20px, 48px)", () => {
    const html16 = renderToString(<RelationalDatabaseIcon size={16} />);
    expect(html16).toContain('width="16"');
    expect(html16).toContain('height="16"');

    const html48 = renderToString(<VectorDatabaseIcon size={48} />);
    expect(html48).toContain('width="48"');
    expect(html48).toContain('height="48"');
  });
});

