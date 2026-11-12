import type {
  DatabaseSchema,
  DatabaseRow,
  DatabaseScenario,
} from "./database-schemas";

export const SAMPLE_DATABASE_SCHEMA: DatabaseSchema = {
  tables: {
    users: {
      name: "users",
      columns: [
        { name: "id", type: "integer", primaryKey: true },
        { name: "name", type: "string" },
        { name: "email", type: "string" },
      ],
      primaryKey: ["id"],
      indexes: [
        {
          id: "idx_users_pk",
          name: "users_pkey",
          tableName: "users",
          columns: ["id"],
          unique: true,
          type: "btree",
        },
      ],
    },
    customers: {
      name: "customers",
      columns: [
        { name: "id", type: "integer", primaryKey: true },
        { name: "name", type: "string" },
        { name: "tier", type: "string" },
      ],
      primaryKey: ["id"],
      indexes: [
        {
          id: "idx_customers_pk",
          name: "customers_pkey",
          tableName: "customers",
          columns: ["id"],
          unique: true,
          type: "btree",
        },
      ],
    },
    products: {
      name: "products",
      columns: [
        { name: "id", type: "integer", primaryKey: true },
        { name: "name", type: "string" },
        { name: "price", type: "decimal" },
        { name: "category", type: "string" },
      ],
      primaryKey: ["id"],
      indexes: [
        {
          id: "idx_products_pk",
          name: "products_pkey",
          tableName: "products",
          columns: ["id"],
          unique: true,
          type: "btree",
        },
      ],
    },
    orders: {
      name: "orders",
      columns: [
        { name: "id", type: "integer", primaryKey: true },
        { name: "user_id", type: "integer" },
        { name: "customer_id", type: "integer" },
        { name: "total", type: "decimal" },
        { name: "status", type: "string" },
      ],
      primaryKey: ["id"],
      indexes: [
        {
          id: "idx_orders_pk",
          name: "orders_pkey",
          tableName: "orders",
          columns: ["id"],
          unique: true,
          type: "btree",
        },
        {
          id: "idx_orders_customer_id",
          name: "idx_orders_customer_id",
          tableName: "orders",
          columns: ["customer_id"],
          unique: false,
          type: "btree",
        },
      ],
    },
    accounts: {
      name: "accounts",
      columns: [
        { name: "id", type: "integer", primaryKey: true },
        { name: "name", type: "string" },
        { name: "balance", type: "decimal" },
      ],
      primaryKey: ["id"],
      indexes: [
        {
          id: "idx_accounts_pk",
          name: "accounts_pkey",
          tableName: "accounts",
          columns: ["id"],
          unique: true,
          type: "btree",
        },
      ],
    },
    inventory: {
      name: "inventory",
      columns: [
        { name: "id", type: "integer", primaryKey: true },
        { name: "sku", type: "string" },
        { name: "stock", type: "integer" },
      ],
      primaryKey: ["id"],
      indexes: [
        {
          id: "idx_inventory_pk",
          name: "inventory_pkey",
          tableName: "inventory",
          columns: ["id"],
          unique: true,
          type: "btree",
        },
      ],
    },
  },
};

export const SAMPLE_DATABASE_FIXTURES: Record<string, DatabaseRow[]> = {
  users: [
    { id: 1, name: "Alice", email: "alice@example.com" },
    { id: 2, name: "Bob", email: "bob@example.com" },
    { id: 3, name: "Charlie", email: "charlie@example.com" },
  ],
  customers: [
    { id: 101, name: "Acme Corp", tier: "enterprise" },
    { id: 102, name: "Globex Inc", tier: "standard" },
    { id: 103, name: "Soylent Corp", tier: "premium" },
    { id: 104, name: "Initech LLC", tier: "standard" },
  ],
  products: [
    { id: 42, name: "Quantum Processor", price: 799.99, category: "Hardware" },
    { id: 43, name: "Neural Neural Accelerator", price: 1299.5, category: "Hardware" },
    { id: 44, name: "Optic Fiber Bus", price: 149.0, category: "Networking" },
    { id: 45, name: "Shield Security Module", price: 349.99, category: "Security" },
    { id: 46, name: "High Density Memory 128GB", price: 420.0, category: "Memory" },
  ],
  orders: [
    { id: 1001, user_id: 1, customer_id: 101, total: 1599.98, status: "completed" },
    { id: 1002, user_id: 1, customer_id: 101, total: 349.99, status: "pending" },
    { id: 1003, user_id: 2, customer_id: 102, total: 799.99, status: "completed" },
    { id: 1004, user_id: 3, customer_id: 103, total: 2599.0, status: "shipped" },
    { id: 1005, user_id: 2, customer_id: 101, total: 149.0, status: "cancelled" },
    { id: 1006, user_id: 3, customer_id: 104, total: 420.0, status: "shipped" },
  ],
  accounts: [
    { id: 1, name: "Primary Checking", balance: 5000.0 },
    { id: 2, name: "Treasury Reserves", balance: 25000.0 },
    { id: 3, name: "Escrow Holding", balance: 1200.0 },
  ],
  inventory: [
    { id: 10, sku: "SKU-PRO-42", stock: 150 },
    { id: 20, sku: "SKU-NET-44", stock: 45 },
    { id: 30, sku: "SKU-MEM-46", stock: 12 },
  ],
};

export type DatabaseScenarioPresetId =
  | "primary_key_lookup"
  | "sequential_scan"
  | "indexed_lookup"
  | "nested_loop_join"
  | "hash_join"
  | "transaction_commit"
  | "transaction_rollback"
  | "lock_contention"
  | "deadlock"
  | "replica_lag"
  | "stale_read"
  | "connection_pool_saturation";

export interface PresetMetadata {
  id: DatabaseScenarioPresetId;
  title: string;
  category: "Query Optimization" | "Transactions & Concurrency" | "Replication & Capacity";
  description: string;
  defaultSql: string;
}

export const DATABASE_PRESET_METADATA: Record<DatabaseScenarioPresetId, PresetMetadata> = {
  primary_key_lookup: {
    id: "primary_key_lookup",
    title: "B-Tree Primary Key Lookup",
    category: "Query Optimization",
    description: "Evaluates exact primary key index seek, skipping sequential table scan with O(log N) lookup.",
    defaultSql: "SELECT * FROM products WHERE id = 42;",
  },
  sequential_scan: {
    id: "sequential_scan",
    title: "Full Table Sequential Scan",
    category: "Query Optimization",
    description: "Scans every row sequentially because no index exists on the status column.",
    defaultSql: "SELECT * FROM orders WHERE status = 'shipped';",
  },
  indexed_lookup: {
    id: "indexed_lookup",
    title: "Secondary Index Scan",
    category: "Query Optimization",
    description: "Probes idx_orders_customer_id to retrieve matching order pointers without scanning entire table.",
    defaultSql: "SELECT * FROM orders WHERE customer_id = 101;",
  },
  nested_loop_join: {
    id: "nested_loop_join",
    title: "Nested Loop Join",
    category: "Query Optimization",
    description: "Iterates outer users table and matches correlated orders via user_id.",
    defaultSql: "SELECT users.name, orders.total FROM users INNER JOIN orders ON users.id = orders.user_id WHERE users.id = 1;",
  },
  hash_join: {
    id: "hash_join",
    title: "In-Memory Hash Join",
    category: "Query Optimization",
    description: "Builds in-memory hash table on customers and probes orders in a single pass.",
    defaultSql: "SELECT customers.name, orders.total FROM customers INNER JOIN orders ON customers.id = orders.customer_id;",
  },
  transaction_commit: {
    id: "transaction_commit",
    title: "ACID Transaction Commit",
    category: "Transactions & Concurrency",
    description: "Atomic balance transfer across accounts, persisting MVCC row versions upon COMMIT.",
    defaultSql: "UPDATE accounts SET balance = 4900.0 WHERE id = 1;",
  },
  transaction_rollback: {
    id: "transaction_rollback",
    title: "Transaction Rollback",
    category: "Transactions & Concurrency",
    description: "Aborts uncommitted inventory deduction, restoring row state seamlessly.",
    defaultSql: "UPDATE inventory SET stock = 145 WHERE id = 10;",
  },
  lock_contention: {
    id: "lock_contention",
    title: "Row Lock Contention",
    category: "Transactions & Concurrency",
    description: "Tx1 holds Exclusive lock on account 1; Tx2 is blocked into wait state until Tx1 commits.",
    defaultSql: "UPDATE accounts SET balance = balance - 100 WHERE id = 1;",
  },
  deadlock: {
    id: "deadlock",
    title: "Deadlock Detection & Resolution",
    category: "Transactions & Concurrency",
    description: "Cross-holding lock cycle between Tx1 and Tx2. Wait-for graph detects cycle and aborts victim.",
    defaultSql: "UPDATE accounts SET balance = 4800 WHERE id = 1;",
  },
  replica_lag: {
    id: "replica_lag",
    title: "Primary-Replica Lag Simulation",
    category: "Replication & Capacity",
    description: "Primary generates replication WAL entries while replica lags by 200ms virtual time.",
    defaultSql: "INSERT INTO products (id, name, price, category) VALUES (47, 'Edge Gateway Router', 650.0, 'Networking');",
  },
  stale_read: {
    id: "stale_read",
    title: "Asynchronous Stale Read Detection",
    category: "Replication & Capacity",
    description: "Primary commits price change; read directed to lagging replica returns stale price.",
    defaultSql: "SELECT * FROM products WHERE id = 42;",
  },
  connection_pool_saturation: {
    id: "connection_pool_saturation",
    title: "Connection Pool Saturation",
    category: "Replication & Capacity",
    description: "Pool size limited to 2 connections with queued requests exceeding capacity.",
    defaultSql: "SELECT * FROM orders;",
  },
};

export function createDatabasePresetScenario(
  presetId: DatabaseScenarioPresetId,
  databaseNodeId = "database_primary"
): DatabaseScenario {
  const meta = DATABASE_PRESET_METADATA[presetId];

  const baseScenario: DatabaseScenario = {
    version: 1,
    id: `db_scenario_${presetId}`,
    databaseNodeId,
    title: meta.title,
    description: meta.description,
    schema: JSON.parse(JSON.stringify(SAMPLE_DATABASE_SCHEMA)),
    fixtures: JSON.parse(JSON.stringify(SAMPLE_DATABASE_FIXTURES)),
    primaryQuery: meta.defaultSql,
    limits: {
      maxRows: 5000,
      maxEvents: 2000,
      maxVirtualDurationMs: 30000,
    },
  };

  switch (presetId) {
    case "transaction_commit":
      baseScenario.concurrentTransactions = [
        {
          id: "tx_101",
          name: "Tx Transfer Funds",
          isolationLevel: "read_committed",
          status: "committed",
          startedAtMs: 10,
          completedAtMs: 80,
          readSet: ["accounts:1", "accounts:2"],
          writeSet: ["accounts:1", "accounts:2"],
          heldLocks: ["accounts:1", "accounts:2"],
          operations: [
            { id: "op_1", type: "BEGIN", atMs: 10 },
            { id: "op_2", type: "QUERY", query: "UPDATE accounts SET balance = 4900 WHERE id = 1", atMs: 25 },
            { id: "op_3", type: "QUERY", query: "UPDATE accounts SET balance = 25100 WHERE id = 2", atMs: 50 },
            { id: "op_4", type: "COMMIT", atMs: 80 },
          ],
        },
      ];
      break;

    case "transaction_rollback":
      baseScenario.concurrentTransactions = [
        {
          id: "tx_102",
          name: "Tx Inventory Reserve",
          isolationLevel: "read_committed",
          status: "aborted",
          startedAtMs: 10,
          completedAtMs: 60,
          readSet: ["inventory:10"],
          writeSet: ["inventory:10"],
          heldLocks: [],
          operations: [
            { id: "op_1", type: "BEGIN", atMs: 10 },
            { id: "op_2", type: "QUERY", query: "UPDATE inventory SET stock = 145 WHERE id = 10", atMs: 30 },
            { id: "op_3", type: "ROLLBACK", atMs: 60 },
          ],
        },
      ];
      break;

    case "lock_contention":
      baseScenario.concurrentTransactions = [
        {
          id: "tx_holder",
          name: "Tx 1 (Lock Holder)",
          isolationLevel: "read_committed",
          status: "active",
          startedAtMs: 0,
          readSet: ["accounts:1"],
          writeSet: ["accounts:1"],
          heldLocks: ["accounts:1"],
          operations: [
            { id: "op_1", type: "BEGIN", atMs: 0 },
            { id: "op_2", type: "QUERY", query: "UPDATE accounts SET balance = 4900 WHERE id = 1", atMs: 20 },
          ],
        },
        {
          id: "tx_waiter",
          name: "Tx 2 (Waiting)",
          isolationLevel: "read_committed",
          status: "waiting",
          startedAtMs: 30,
          readSet: [],
          writeSet: [],
          heldLocks: [],
          waitingForLock: {
            transactionId: "tx_waiter",
            resourceId: "accounts:1",
            requestedMode: "exclusive",
            waitingForTransactionId: "tx_holder",
            waitingSinceMs: 40,
          },
          operations: [
            { id: "op_3", type: "BEGIN", atMs: 30 },
            { id: "op_4", type: "QUERY", query: "UPDATE accounts SET balance = 4800 WHERE id = 1", atMs: 40 },
          ],
        },
      ];
      break;

    case "deadlock":
      baseScenario.concurrentTransactions = [
        {
          id: "tx_A",
          name: "Transaction Alpha",
          isolationLevel: "read_committed",
          status: "waiting",
          startedAtMs: 10,
          readSet: ["accounts:1"],
          writeSet: ["accounts:1"],
          heldLocks: ["accounts:1"],
          waitingForLock: {
            transactionId: "tx_A",
            resourceId: "accounts:2",
            requestedMode: "exclusive",
            waitingForTransactionId: "tx_B",
            waitingSinceMs: 50,
          },
          operations: [
            { id: "op_a1", type: "BEGIN", atMs: 10 },
            { id: "op_a2", type: "QUERY", query: "UPDATE accounts SET balance = 4900 WHERE id = 1", atMs: 20 },
            { id: "op_a3", type: "QUERY", query: "UPDATE accounts SET balance = 25100 WHERE id = 2", atMs: 50 },
          ],
        },
        {
          id: "tx_B",
          name: "Transaction Beta",
          isolationLevel: "read_committed",
          status: "waiting",
          startedAtMs: 15,
          readSet: ["accounts:2"],
          writeSet: ["accounts:2"],
          heldLocks: ["accounts:2"],
          waitingForLock: {
            transactionId: "tx_B",
            resourceId: "accounts:1",
            requestedMode: "exclusive",
            waitingForTransactionId: "tx_A",
            waitingSinceMs: 60,
          },
          operations: [
            { id: "op_b1", type: "BEGIN", atMs: 15 },
            { id: "op_b2", type: "QUERY", query: "UPDATE accounts SET balance = 24900 WHERE id = 2", atMs: 30 },
            { id: "op_b3", type: "QUERY", query: "UPDATE accounts SET balance = 5100 WHERE id = 1", atMs: 60 },
          ],
        },
      ];
      break;

    case "replica_lag":
      baseScenario.replication = {
        primaryNodeId: databaseNodeId,
        replicaNodeIds: ["replica_analytics_01", "replica_reporting_02"],
        replicationDelayMs: 250,
        readPreference: "replica",
      };
      break;

    case "stale_read":
      baseScenario.replication = {
        primaryNodeId: databaseNodeId,
        replicaNodeIds: ["replica_read_01"],
        replicationDelayMs: 350,
        readPreference: "replica",
      };
      break;

    case "connection_pool_saturation":
      baseScenario.capacity = {
        maxConnections: 2,
        activeConnections: 2,
        idleConnections: 0,
        queueCapacity: 10,
        waitingRequestsCount: 4,
        timeoutMs: 3000,
      };
      break;

    default:
      break;
  }

  return baseScenario;
}
