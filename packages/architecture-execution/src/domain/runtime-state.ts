import type {
  BehaviorScenario,
  ModeledHttpRequest,
  ModeledHttpResponse,
} from "../schemas/behavior.schemas";

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

    return {
      cache: clonedCache,
      database: clonedDb,
      loadBalancerCounters: { ...state.loadBalancerCounters },
      callStack: state.callStack.map((f) => ({ ...f })),
      activeRequest: state.activeRequest ? { ...state.activeRequest } : null,
      activeResponse: state.activeResponse ? { ...state.activeResponse } : null,
      stateTransitions: state.stateTransitions.map((t) => ({ ...t })),
    };
  }

  public static cacheLookup(
    state: ModeledRuntimeState,
    key: string,
    nowMs: number
  ): { hit: boolean; value?: unknown; reason: string } {
    const entry = state.cache[key];
    if (!entry) {
      return { hit: false, reason: `Key "${key}" does not exist in modeled cache.` };
    }
    if (nowMs > entry.expiresAtMs) {
      return {
        hit: false,
        reason: `Key "${key}" expired at virtual time ${entry.expiresAtMs}ms (current: ${nowMs}ms).`,
      };
    }
    return { hit: true, value: entry.value, reason: `Cache hit for key "${key}".` };
  }

  public static cacheSet(
    state: ModeledRuntimeState,
    key: string,
    value: unknown,
    ttlMs: number,
    nowMs: number,
    sequence: number,
    componentId: string
  ): void {
    const before = state.cache[key] ? { ...state.cache[key] } : null;
    const expiresAtMs = ttlMs > 0 ? nowMs + ttlMs : Number.MAX_SAFE_INTEGER;
    const newEntry: CacheEntry = {
      key,
      value,
      createdAtMs: nowMs,
      expiresAtMs,
    };
    state.cache[key] = newEntry;

    state.stateTransitions.push({
      sequence,
      atMs: nowMs,
      type: "cache.set",
      componentId,
      summary: `Stored key "${key}" with TTL ${ttlMs}ms in modeled cache.`,
      before,
      after: newEntry,
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
