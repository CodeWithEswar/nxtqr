import type {
  BehaviorScenario,
  ModeledHttpRequest,
  ModeledHttpResponse,
} from "../schemas/behavior.schemas";
import type {
  TraceSpan,
  ExecutionBranch,
  ModeledQueueState,
  ModeledMessage,
  FanInBarrier,
} from "../schemas/distributed.schemas";
import type {
  ComponentHealthStatus,
  ResilienceMetrics,
} from "../resilience/fault-schemas";
import type {
  ServiceInstance,
  ModeledTrafficQueue,
  ModeledRateLimiterState,
  AutoscalingState,
  PerformanceSample,
  PerformanceSummary,
} from "../traffic/traffic-schemas";

export interface CacheEntry {
  key: string;
  value: unknown;
  createdAtMs: number;
  expiresAtMs: number;
}

export interface CallStackFrame {
  frameId: string;
  requestId: string;
  callerNodeId: string;
  calleeNodeId: string;
  operation: string;
  atMs: number;
  status: "active" | "waiting" | "returned" | "failed";
}

export interface StateTransitionRecord {
  sequence: number;
  atMs: number;
  type: string;
  componentId: string;
  summary: string;
  before: unknown;
  after: unknown;
}

export interface ModeledRuntimeState {
  cache: Record<string, CacheEntry>;
  database: Record<string, Record<string, Record<string, unknown>>>;
  loadBalancerCounters: Record<string, number>;
  callStack: CallStackFrame[];
  activeRequest: ModeledHttpRequest | null;
  activeResponse: ModeledHttpResponse | null;
  stateTransitions: StateTransitionRecord[];

  // Distributed Tracing & Parallel Execution (Phase 05.4.3)
  activeSpans: TraceSpan[];
  activeBranches: ExecutionBranch[];
  queues: Record<string, ModeledQueueState>;
  activeMessages: ModeledMessage[];
  fanInBarriers: Record<string, FanInBarrier>;
  criticalPathSpanIds: string[];

  // Resilience & Failure Simulation (Phase 05.4.4)
  componentHealth: Record<string, ComponentHealthStatus>;
  activeFaultIds: string[];
  circuitBreakers: Record<
    string,
    {
      state: "closed" | "open" | "half-open";
      failureCount: number;
      consecutiveSuccesses: number;
      lastStateChangeMs: number;
      nextAllowedProbeMs: number;
      tripCount: number;
      totalFastFailures: number;
    }
  >;
  networkConditions: Record<
    string,
    {
      disconnected: boolean;
      additionalLatencyMs: number;
      packetLossRate: number;
      totalDroppedPackets: number;
    }
  >;
  retryCounters: Record<string, number>;
  activeDeadlines: Record<string, number>;
  resilienceMetrics?: ResilienceMetrics;

  // Live Traffic Simulation & Real-Time Performance (Phase 05.4.5)
  trafficInstances: Record<string, ServiceInstance[]>;
  trafficQueues: Record<string, ModeledTrafficQueue>;
  trafficRateLimiters: Record<string, ModeledRateLimiterState>;
  trafficAutoscaling: Record<string, AutoscalingState>;
  trafficCurrentSample?: PerformanceSample;
  trafficSummary?: PerformanceSummary;
}

export class RuntimeStateHelper {
  public static createInitialState(scenario?: BehaviorScenario): ModeledRuntimeState {
    const cache: Record<string, CacheEntry> = {};
    if (scenario?.initialCache) {
      for (const item of scenario.initialCache) {
        cache[item.key] = {
          key: item.key,
          value: item.value,
          createdAtMs: 0,
          expiresAtMs: item.ttlMs > 0 ? item.ttlMs : Number.MAX_SAFE_INTEGER,
        };
      }
    }

    const database: Record<string, Record<string, Record<string, unknown>>> = {};
    if (scenario?.initialDatabase) {
      for (const [tblName, tableDef] of Object.entries(scenario.initialDatabase)) {
        database[tblName] = {};
        for (const [pk, row] of Object.entries(tableDef.rows || {})) {
          database[tblName][pk] = { ...row };
        }
      }
    }

    return {
      cache,
      database,
      loadBalancerCounters: {},
      callStack: [],
      activeRequest: null,
      activeResponse: null,
      stateTransitions: [],
      activeSpans: [],
      activeBranches: [],
      queues: {},
      activeMessages: [],
      fanInBarriers: {},
      criticalPathSpanIds: [],
      componentHealth: {},
      activeFaultIds: [],
      circuitBreakers: {},
      networkConditions: {},
      retryCounters: {},
      activeDeadlines: {},
      trafficInstances: {},
      trafficQueues: {},
      trafficRateLimiters: {},
      trafficAutoscaling: {},
    };
  }

  public static cloneState(state: ModeledRuntimeState): ModeledRuntimeState {
    const clonedCache: Record<string, CacheEntry> = {};
    for (const [k, v] of Object.entries(state.cache)) {
      clonedCache[k] = { ...v };
    }

    const clonedDb: Record<string, Record<string, Record<string, unknown>>> = {};
    for (const [tbl, rows] of Object.entries(state.database)) {
      clonedDb[tbl] = {};
      for (const [pk, row] of Object.entries(rows)) {
        clonedDb[tbl][pk] = { ...row };
      }
    }

    const clonedQueues: Record<string, ModeledQueueState> = {};
    for (const [qId, qState] of Object.entries(state.queues || {})) {
      clonedQueues[qId] = {
        ...qState,
        readyMessageIds: [...qState.readyMessageIds],
        inFlightMessageIds: [...qState.inFlightMessageIds],
        acknowledgedMessageIds: [...qState.acknowledgedMessageIds],
        deadLetteredMessageIds: [...qState.deadLetteredMessageIds],
      };
    }

    const clonedBarriers: Record<string, FanInBarrier> = {};
    for (const [bId, barrier] of Object.entries(state.fanInBarriers || {})) {
      clonedBarriers[bId] = {
        ...barrier,
        expectedBranchIds: [...barrier.expectedBranchIds],
        completedBranchIds: [...barrier.completedBranchIds],
        failedBranchIds: [...barrier.failedBranchIds],
      };
    }

    const clonedCircuitBreakers: Record<string, (typeof state.circuitBreakers)[string]> = {};
    for (const [cbId, cb] of Object.entries(state.circuitBreakers || {})) {
      clonedCircuitBreakers[cbId] = { ...cb };
    }

    const clonedNetworkConditions: Record<string, (typeof state.networkConditions)[string]> = {};
    for (const [netId, net] of Object.entries(state.networkConditions || {})) {
      clonedNetworkConditions[netId] = { ...net };
    }

    const clonedInstances: Record<string, ServiceInstance[]> = {};
    for (const [nodeId, list] of Object.entries(state.trafficInstances || {})) {
      clonedInstances[nodeId] = list.map((inst) => ({ ...inst }));
    }

    const clonedTrafficQueues: Record<string, ModeledTrafficQueue> = {};
    for (const [nodeId, q] of Object.entries(state.trafficQueues || {})) {
      clonedTrafficQueues[nodeId] = { ...q };
    }

    const clonedRateLimiters: Record<string, ModeledRateLimiterState> = {};
    for (const [nodeId, rl] of Object.entries(state.trafficRateLimiters || {})) {
      clonedRateLimiters[nodeId] = { ...rl };
    }

    const clonedAutoscaling: Record<string, AutoscalingState> = {};
    for (const [nodeId, as] of Object.entries(state.trafficAutoscaling || {})) {
      clonedAutoscaling[nodeId] = {
        ...as,
        pendingProvisionings: as.pendingProvisionings.map((p) => ({ ...p })),
      };
    }

    return {
      cache: clonedCache,
      database: clonedDb,
      loadBalancerCounters: { ...state.loadBalancerCounters },
      callStack: (state.callStack || []).map((f) => ({ ...f })),
      activeRequest: state.activeRequest ? { ...state.activeRequest } : null,
      activeResponse: state.activeResponse ? { ...state.activeResponse } : null,
      stateTransitions: (state.stateTransitions || []).map((t) => ({ ...t })),
      activeSpans: (state.activeSpans || []).map((s) => ({ ...s, attributes: { ...s.attributes } })),
      activeBranches: (state.activeBranches || []).map((b) => ({ ...b })),
      queues: clonedQueues,
      activeMessages: (state.activeMessages || []).map((m) => ({ ...m, traceContext: { ...m.traceContext } })),
      fanInBarriers: clonedBarriers,
      criticalPathSpanIds: [...(state.criticalPathSpanIds || [])],
      componentHealth: { ...(state.componentHealth || {}) },
      activeFaultIds: [...(state.activeFaultIds || [])],
      circuitBreakers: clonedCircuitBreakers,
      networkConditions: clonedNetworkConditions,
      retryCounters: { ...(state.retryCounters || {}) },
      activeDeadlines: { ...(state.activeDeadlines || {}) },
      resilienceMetrics: state.resilienceMetrics ? { ...state.resilienceMetrics } : undefined,
      trafficInstances: clonedInstances,
      trafficQueues: clonedTrafficQueues,
      trafficRateLimiters: clonedRateLimiters,
      trafficAutoscaling: clonedAutoscaling,
      trafficCurrentSample: state.trafficCurrentSample ? { ...state.trafficCurrentSample } : undefined,
      trafficSummary: state.trafficSummary ? { ...state.trafficSummary } : undefined,
    };
  }

  public static cacheLookup(
    state: ModeledRuntimeState,
    key: string,
    nowMs: number
  ): { hit: boolean; value?: unknown; reason: string } {
    const entry = state.cache[key];
    if (!entry) {
      return { hit: false, reason: `Cache key "${key}" not found in Redis (cold cache).` };
    }
    if (nowMs > entry.expiresAtMs) {
      delete state.cache[key];
      return { hit: false, reason: `Cache key "${key}" expired at +${entry.expiresAtMs}ms (TTL exceeded).` };
    }
    return { hit: true, value: entry.value, reason: `Cache key "${key}" hit in Redis (TTL valid).` };
  }

  public static cacheSet(
    state: ModeledRuntimeState,
    key: string,
    value: unknown,
    ttlSeconds: number,
    nowMs: number,
    sequence: number,
    componentId: string
  ): void {
    const expiresAtMs = ttlSeconds > 0 ? nowMs + ttlSeconds * 1000 : Number.MAX_SAFE_INTEGER;
    const prev = state.cache[key];
    state.cache[key] = {
      key,
      value,
      createdAtMs: nowMs,
      expiresAtMs,
    };

    state.stateTransitions.push({
      sequence,
      atMs: nowMs,
      type: "cache.set",
      componentId,
      summary: `Stored key "${key}" with TTL ${ttlSeconds}s.`,
      before: prev ? prev.value : null,
      after: value,
    });
  }

  public static databaseGet(
    state: ModeledRuntimeState,
    table: string,
    key: string
  ): { found: boolean; row?: Record<string, unknown>; reason: string } {
    const tbl = state.database[table];
    if (!tbl) {
      return { found: false, reason: `Table "${table}" does not exist in modeled database fixtures.` };
    }
    const row = tbl[key];
    if (!row) {
      return { found: false, reason: `No fixture row matching primary key "${key}" in table "${table}".` };
    }
    return { found: true, row: { ...row }, reason: `Matched row with PK "${key}" in table "${table}".` };
  }

  public static databaseInsert(
    state: ModeledRuntimeState,
    table: string,
    key: string,
    row: Record<string, unknown>,
    nowMs: number,
    sequence: number,
    componentId: string
  ): { success: boolean; error?: string } {
    if (!state.database[table]) {
      state.database[table] = {};
    }
    if (state.database[table][key]) {
      return {
        success: false,
        error: `Duplicate primary key violation: row "${key}" already exists in table "${table}".`,
      };
    }

    state.database[table][key] = { ...row };
    state.stateTransitions.push({
      sequence,
      atMs: nowMs,
      type: "database.insert",
      componentId,
      summary: `Inserted record "${key}" into table "${table}".`,
      before: null,
      after: { ...row },
    });

    return { success: true };
  }

  public static getNextRoundRobinIndex(
    state: ModeledRuntimeState,
    nodeId: string,
    poolSize: number
  ): number {
    if (poolSize <= 0) return 0;
    const current = state.loadBalancerCounters[nodeId] || 0;
    const selected = current % poolSize;
    state.loadBalancerCounters[nodeId] = current + 1;
    return selected;
  }
}
