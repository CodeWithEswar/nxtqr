import type { InfrastructureIconComponent } from "../types";
import { RelationalDatabaseIcon } from "./relational-database-icon";
import { PostgresqlIcon } from "./postgresql-icon";
import { MysqlIcon } from "./mysql-icon";
import { DistributedSqlDatabaseIcon } from "./distributed-sql-database-icon";
import { DocumentDatabaseIcon } from "./document-database-icon";
import { KeyValueDatabaseIcon } from "./key-value-database-icon";
import { WideColumnDatabaseIcon } from "./wide-column-database-icon";
import { GraphDatabaseIcon } from "./graph-database-icon";
import { TimeSeriesDatabaseIcon } from "./time-series-database-icon";
import { VectorDatabaseIcon } from "./vector-database-icon";
import { InMemoryDatabaseIcon } from "./in-memory-database-icon";
import { DatabasePrimaryIcon } from "./database-primary-icon";
import { ReadReplicaIcon } from "./read-replica-icon";
import { DatabaseClusterIcon } from "./database-cluster-icon";
import { DataWarehouseIcon } from "./data-warehouse-icon";

export {
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
};

export const databasesAndPersistenceIconRegistry: Record<string, InfrastructureIconComponent> = {
  "relational-database": RelationalDatabaseIcon,
  postgresql: PostgresqlIcon,
  mysql: MysqlIcon,
  "distributed-sql-database": DistributedSqlDatabaseIcon,
  "document-database": DocumentDatabaseIcon,
  "key-value-database": KeyValueDatabaseIcon,
  "wide-column-database": WideColumnDatabaseIcon,
  "graph-database": GraphDatabaseIcon,
  "time-series-database": TimeSeriesDatabaseIcon,
  "vector-database": VectorDatabaseIcon,
  "in-memory-database": InMemoryDatabaseIcon,
  "database-primary": DatabasePrimaryIcon,
  "read-replica": ReadReplicaIcon,
  "database-cluster": DatabaseClusterIcon,
  "data-warehouse": DataWarehouseIcon,
};

export function getDatabasesAndPersistenceInfrastructureIcon(
  slug: string
): InfrastructureIconComponent | null {
  return databasesAndPersistenceIconRegistry[slug] || null;
}

