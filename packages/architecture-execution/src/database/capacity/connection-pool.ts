import type { ConnectionPoolConfig } from "../database-schemas";
import type {
  ConnectionPoolAcquiredEvent,
  ConnectionPoolReleasedEvent,
} from "../database-events";

export class ConnectionPoolManager {
  private config: ConnectionPoolConfig;
  private nodeId: string;
  private nextConnectionId = 1;
  private activeConnSet = new Set<string>();
  private eventSeq = 1;

  constructor(
    nodeId = "primary_db",
    config: Partial<ConnectionPoolConfig> = {}
  ) {
    this.nodeId = nodeId;
    this.config = {
      maxConnections: config.maxConnections ?? 10,
      activeConnections: config.activeConnections ?? 0,
      idleConnections: config.idleConnections ?? (config.maxConnections ?? 10),
      queueCapacity: config.queueCapacity ?? 50,
      waitingRequestsCount: config.waitingRequestsCount ?? 0,
      timeoutMs: config.timeoutMs ?? 5000,
    };
  }

  public initialize(nodeId: string, config: ConnectionPoolConfig): void {
    this.nodeId = nodeId;
    this.config = { ...config };
    this.activeConnSet.clear();
    for (let i = 0; i < this.config.activeConnections; i++) {
      this.activeConnSet.add(`conn_${this.nextConnectionId++}`);
    }
  }

  public getConfig(): ConnectionPoolConfig {
    return {
      ...this.config,
      activeConnections: this.activeConnSet.size,
      idleConnections: Math.max(0, this.config.maxConnections - this.activeConnSet.size),
    };
  }

  /**
   * Attempts to acquire a database connection.
   */
  public acquireConnection(
    atMs = 0,
    sequence?: number
  ): {
    success: boolean;
    connectionId?: string;
    event?: ConnectionPoolAcquiredEvent;
    isQueued?: boolean;
    poolSaturated?: boolean;
  } {
    if (this.activeConnSet.size < this.config.maxConnections) {
      const connId = `conn_${this.nextConnectionId++}`;
      this.activeConnSet.add(connId);

      const seq = sequence ?? this.eventSeq++;
      const event: ConnectionPoolAcquiredEvent = {
        id: `evt_conn_acq_${connId}`,
        sequence: seq,
        atMs,
        durationMs: 1,
        explanation: `Acquired connection ${connId} (${this.activeConnSet.size}/${this.config.maxConnections} active)`,
        type: "connection.acquired",
        nodeId: this.nodeId,
        connectionId: connId,
        activeCount: this.activeConnSet.size,
      };

      return {
        success: true,
        connectionId: connId,
        event,
        poolSaturated: false,
      };
    }

    // Pool saturated - request must queue
    this.config.waitingRequestsCount++;
    return {
      success: false,
      isQueued: true,
      poolSaturated: true,
    };
  }

  /**
   * Releases an active connection back to the pool.
   */
  public releaseConnection(
    connectionId: string,
    atMs = 0,
    sequence?: number
  ): ConnectionPoolReleasedEvent | null {
    if (!this.activeConnSet.has(connectionId)) {
      return null;
    }

    this.activeConnSet.delete(connectionId);
    if (this.config.waitingRequestsCount > 0) {
      this.config.waitingRequestsCount--;
    }

    const seq = sequence ?? this.eventSeq++;
    return {
      id: `evt_conn_rel_${connectionId}`,
      sequence: seq,
      atMs,
      durationMs: 1,
      explanation: `Released connection ${connectionId} (${this.activeConnSet.size}/${this.config.maxConnections} active)`,
      type: "connection.released",
      nodeId: this.nodeId,
      connectionId,
      activeCount: this.activeConnSet.size,
    };
  }
}
