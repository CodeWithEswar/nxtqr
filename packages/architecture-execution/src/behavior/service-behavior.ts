import type { ComponentBehaviorAdapter, ComponentBehaviorContext, ComponentBehaviorResult } from "./behavior-adapter";
import type { ExecutionEvent } from "../domain/execution-event";
import type { ModeledHttpResponse } from "../schemas/behavior.schemas";
import { RuntimeStateHelper } from "../domain/runtime-state";

export class ServiceBehaviorAdapter implements ComponentBehaviorAdapter {
  public readonly id = "service.http";
  public readonly version = "1.0.0";
  public readonly supportedTypes = [
    "service",
    "microservice",
    "app_service",
    "worker",
    "lambda",
    "function",
    "backend",
    "process",
  ];

  public execute(ctx: ComponentBehaviorContext): ComponentBehaviorResult {
    const { node, request, outEdges, nodeMap, runtimeState, scenario, runId, getSequence, simulatedTimeMs } = ctx;
    const events: ExecutionEvent[] = [];
    let currentTime = simulatedTimeMs;

    // 1. Request Received at Application Service
    events.push({
      id: `evt_${runId}_${getSequence()}_srv_rcvd_${node.id}`,
      sequence: ctx.getSequence(),
      type: "request.received",
      atMs: currentTime,
      durationMs: 30,
      explanation: `Service "${node.label || node.id}" received ${request.method} ${request.path}. Initializing handler pipeline...`,
      request,
      nodeId: node.id,
      nodeLabel: node.label || node.id,
    });
    currentTime += 30;

    // Identify connected storage / helper components
    const cacheEdge = outEdges.find((e) => {
      const target = nodeMap.get(e.target);
      return target && ["cache", "redis", "memcached"].includes(target.type || "");
    });
    const dbEdge = outEdges.find((e) => {
      const target = nodeMap.get(e.target);
      return target && ["database", "postgres", "mysql", "mongodb", "storage"].includes(target.type || "");
    });
    const externalEdge = outEdges.find((e) => {
      const target = nodeMap.get(e.target);
      return target && ["external_service", "external", "third_party", "api"].includes(target.type || "");
    });

    // Check if scenario preset is external-error
    if (scenario.presetId === "external-error" || (externalEdge && scenario.externalStubConfig?.failure)) {
      events.push({
        id: `evt_${runId}_${getSequence()}_ext_err_${node.id}`,
        sequence: ctx.getSequence(),
        type: "component.processing.started",
        atMs: currentTime,
        durationMs: 80,
        explanation: `Service calling external dependency "${externalEdge?.target || "PaymentProvider"}".`,
        nodeId: node.id,
        operation: "external.call",
      });
      currentTime += 80;

      const response: ModeledHttpResponse = {
        requestId: request.id,
        status: 503,
        headers: { "content-type": "application/json" },
        body: { error: "Service Unavailable", message: "Upstream external provider timed out or failed." },
        sourceNodeId: node.id,
        destinationNodeId: request.sourceNodeId,
        latencyMs: currentTime - simulatedTimeMs,
      };

      events.push({
        id: `evt_${runId}_${getSequence()}_resp_created_${node.id}`,
        sequence: ctx.getSequence(),
        type: "response.created",
        atMs: currentTime,
        durationMs: 20,
        explanation: `Service constructed error response HTTP 503 Service Unavailable.`,
        response,
        nodeId: node.id,
        nodeLabel: node.label || node.id,
      });

      return {
        events,
        durationMs: currentTime - simulatedTimeMs,
        outgoingRequests: [],
        response,
        outcome: "respond",
        reason: "External dependency failed with HTTP 503.",
      };
    }

    // Check if database write scenario
    if (scenario.presetId === "database-write" || request.method === "POST" || request.method === "PUT") {
      const targetDb = dbEdge ? nodeMap.get(dbEdge.target) : null;
      const targetDbId = targetDb?.id || "database_default";
      const table = "orders";
      const recordKey = `ord_${Date.now().toString().slice(-4)}`;
      const payload = (request.body && typeof request.body === "object" ? request.body : { item: "Widget", amount: 99 }) as Record<string, unknown>;

      events.push({
        id: `evt_${runId}_${getSequence()}_db_write_${node.id}`,
        sequence: ctx.getSequence(),
        type: "database.write.completed",
        atMs: currentTime,
        durationMs: 60,
        explanation: `Database "${targetDb?.label || targetDbId}" inserted row into table "${table}" with PK "${recordKey}".`,
        dbNodeId: targetDbId,
        table,
        key: recordKey,
        operation: "insert",
        rowPreview: payload,
      });
      currentTime += 60;

      RuntimeStateHelper.databaseInsert(runtimeState, table, recordKey, payload, currentTime, ctx.getSequence(), node.id);

      const response: ModeledHttpResponse = {
        requestId: request.id,
        status: 201,
        headers: { "content-type": "application/json", "location": `/api/orders/${recordKey}` },
        body: { id: recordKey, ...payload, status: "created" },
        sourceNodeId: node.id,
        destinationNodeId: request.sourceNodeId,
        latencyMs: currentTime - simulatedTimeMs,
      };

      events.push({
        id: `evt_${runId}_${getSequence()}_resp_created_${node.id}`,
        sequence: ctx.getSequence(),
        type: "response.created",
        atMs: currentTime,
        durationMs: 20,
        explanation: `Service constructed response HTTP 201 Created for new resource "${recordKey}".`,
        response,
        nodeId: node.id,
        nodeLabel: node.label || node.id,
      });

      return {
        events,
        durationMs: currentTime - simulatedTimeMs,
        outgoingRequests: [],
        response,
        outcome: "respond",
        reason: `Successfully processed POST write and inserted record into ${table}.`,
      };
    }

    // Standard Cache-Aside Flow (GET request)
    // Extract lookup key from path, e.g. /api/products/42 -> product:42
    const pathParts = request.path.split("/").filter(Boolean);
    const resourceName = pathParts[pathParts.length - 2] || pathParts[0] || "item";
    const resourceId = pathParts[pathParts.length - 1] || "default";
    const cacheKey = `${resourceName}:${resourceId}`;

    const cacheNode = cacheEdge ? nodeMap.get(cacheEdge.target) : null;
    const cacheNodeId = cacheNode?.id || "cache_default";

    // 2. Cache Lookup
    events.push({
      id: `evt_${runId}_${getSequence()}_cache_lookup_${node.id}`,
      sequence: ctx.getSequence(),
      type: "cache.lookup.started",
      atMs: currentTime,
      durationMs: 25,
      explanation: `Service "${node.label || node.id}" issued cache lookup for key "${cacheKey}" to "${cacheNode?.label || cacheNodeId}".`,
      cacheNodeId,
      key: cacheKey,
    });
    currentTime += 25;

    const cacheResult = RuntimeStateHelper.cacheLookup(runtimeState, cacheKey, currentTime);

    // CACHE HIT SCENARIO
    if (cacheResult.hit && scenario.presetId !== "cache-miss") {
      events.push({
        id: `evt_${runId}_${getSequence()}_cache_hit_${node.id}`,
        sequence: ctx.getSequence(),
        type: "cache.hit",
        atMs: currentTime,
        durationMs: 20,
        explanation: `Cache HIT for "${cacheKey}". Returning stored value without querying database.`,
        cacheNodeId,
        key: cacheKey,
        valuePreview: cacheResult.value,
        ttlRemainingMs: 180000,
      });
      currentTime += 20;

      const response: ModeledHttpResponse = {
        requestId: request.id,
        status: 200,
        headers: { "content-type": "application/json", "x-cache": "HIT" },
        body: cacheResult.value,
        sourceNodeId: node.id,
        destinationNodeId: request.sourceNodeId,
        latencyMs: currentTime - simulatedTimeMs,
      };

      events.push({
        id: `evt_${runId}_${getSequence()}_resp_created_${node.id}`,
        sequence: ctx.getSequence(),
        type: "response.created",
        atMs: currentTime,
        durationMs: 20,
        explanation: `Service constructed HTTP 200 OK response from cached value.`,
        response,
        nodeId: node.id,
        nodeLabel: node.label || node.id,
      });

      return {
        events,
        durationMs: currentTime - simulatedTimeMs,
        outgoingRequests: [],
        response,
        outcome: "respond",
        reason: `Cache hit for "${cacheKey}". Database read bypassed.`,
      };
    }

    // CACHE MISS SCENARIO
    events.push({
      id: `evt_${runId}_${getSequence()}_cache_miss_${node.id}`,
      sequence: ctx.getSequence(),
      type: "cache.miss",
      atMs: currentTime,
      durationMs: 20,
      explanation: `Cache MISS for "${cacheKey}". ${cacheResult.reason} Fetching from persistent database.`,
      cacheNodeId,
      key: cacheKey,
      decisionReason: cacheResult.reason,
    });
    currentTime += 20;

    // Database Read
    const dbNode = dbEdge ? nodeMap.get(dbEdge.target) : null;
    const dbNodeId = dbNode?.id || "database_default";
    const tableName = resourceName === "products" ? "products" : "items";

    events.push({
      id: `evt_${runId}_${getSequence()}_db_read_start_${node.id}`,
      sequence: ctx.getSequence(),
      type: "database.read.started",
      atMs: currentTime,
      durationMs: 30,
      explanation: `Service queried database "${dbNode?.label || dbNodeId}" for table "${tableName}" with PK "${resourceId}".`,
      dbNodeId,
      table: tableName,
      key: resourceId,
    });
    currentTime += 30;

    const dbResult = RuntimeStateHelper.databaseGet(runtimeState, tableName, resourceId);

    // If row exists in fixtures, use it; otherwise create modeled row
    const rowData = dbResult.found && dbResult.row
      ? dbResult.row
      : { id: resourceId, name: `Model Product #${resourceId}`, price: 49.99, inStock: true };

    events.push({
      id: `evt_${runId}_${getSequence()}_db_read_done_${node.id}`,
      sequence: ctx.getSequence(),
      type: "database.read.completed",
      atMs: currentTime,
      durationMs: 40,
      explanation: `Database returned row for PK "${resourceId}".`,
      dbNodeId: dbNodeId,
      table: tableName,
      key: resourceId,
      found: true,
      rowPreview: rowData,
      stateSnapshot: RuntimeStateHelper.cloneState(runtimeState),
    });
    currentTime += 40;

    // Write back to Cache (Populate Cache on Miss)
    RuntimeStateHelper.cacheSet(runtimeState, cacheKey, rowData, 300000, currentTime, ctx.getSequence(), node.id);

    events.push({
      id: `evt_${runId}_${getSequence()}_cache_write_${node.id}`,
      sequence: ctx.getSequence(),
      type: "cache.write",
      atMs: currentTime,
      durationMs: 25,
      explanation: `Service wrote retrieved data for "${cacheKey}" into cache with TTL 300000ms.`,
      cacheNodeId,
      key: cacheKey,
      valuePreview: rowData,
      ttlMs: 300000,
      stateSnapshot: RuntimeStateHelper.cloneState(runtimeState),
    });
    currentTime += 25;

    // Construct Response
    const response: ModeledHttpResponse = {
      requestId: request.id,
      status: 200,
      headers: { "content-type": "application/json", "x-cache": "MISS" },
      body: rowData,
      sourceNodeId: node.id,
      destinationNodeId: request.sourceNodeId,
      latencyMs: currentTime - simulatedTimeMs,
    };

    events.push({
      id: `evt_${runId}_${getSequence()}_resp_created_${node.id}`,
      sequence: ctx.getSequence(),
      type: "response.created",
      atMs: currentTime,
      durationMs: 20,
      explanation: `Service constructed HTTP 200 OK response with database record.`,
      response,
      nodeId: node.id,
      nodeLabel: node.label || node.id,
    });

    return {
      events,
      durationMs: currentTime - simulatedTimeMs,
      outgoingRequests: [],
      response,
      outcome: "respond",
      reason: `Cache miss resolved via database read; cache updated.`,
    };
  }
}
