import type { GraphDocument } from "@nxtqr/graph-schema";
import type { SimulationStatus, SimulationEvent, SimulationResult, SimulationRunner } from "./simulation";

export class DeterministicSimulationEngine implements SimulationRunner {
  private document: GraphDocument | null = null;
  private status: SimulationStatus = "idle";
  private currentStep = 0;
  private startTime = 0;
  private events: SimulationEvent[] = [];
  private executionQueue: string[] = []; // queue of node IDs to visit
  private visitedNodeIds = new Set<string>();
  private completedNodeIds = new Set<string>();
  private onEventCallback?: (event: SimulationEvent) => void;
  private onStatusChangeCallback?: (status: SimulationStatus) => void;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private speedMultiplier = 1.0;

  constructor(options?: {
    onEvent?: (event: SimulationEvent) => void;
    onStatusChange?: (status: SimulationStatus) => void;
    speed?: number;
  }) {
    this.onEventCallback = options?.onEvent;
    this.onStatusChangeCallback = options?.onStatusChange;
    this.speedMultiplier = options?.speed ?? 1.0;
  }

  public async initialize(document: GraphDocument, _parameters?: Record<string, unknown>): Promise<void> {
    this.reset();
    this.document = document;
    this.status = "idle";
    this.startTime = Date.now();

    // Determine initial entrypoint nodes:
    // Nodes with type="input" or nodes that have no incoming edges
    const targetNodeIds = new Set(document.edges.map((e) => e.target));
    const entryNodes = document.nodes.filter(
      (n) => n.type === "input" || !targetNodeIds.has(n.id)
    );

    this.executionQueue = entryNodes.length > 0 ? entryNodes.map((n) => n.id) : document.nodes.slice(0, 1).map((n) => n.id);
    this.notifyStatus("idle");
  }

  public getStatus(): SimulationStatus {
    return this.status;
  }

  public getEvents(): SimulationEvent[] {
    return [...this.events];
  }

  public setSpeed(multiplier: number): void {
    this.speedMultiplier = Math.max(0.25, Math.min(10, multiplier));
  }

  public async step(): Promise<SimulationEvent | null> {
    if (!this.document || this.executionQueue.length === 0) {
      if (this.status === "running") {
        this.status = "completed";
        this.notifyStatus("completed");
      }
      return null;
    }

    const nodeId = this.executionQueue.shift()!;
    const node = this.document.nodes.find((n) => n.id === nodeId);
    if (!node) return null;

    this.currentStep++;
    this.visitedNodeIds.add(nodeId);

    // Find incoming edge if any
    const incomingEdge = this.document.edges.find((e) => e.target === nodeId && this.visitedNodeIds.has(e.source));

    // Emit node execution event
    const event: SimulationEvent = {
      id: `evt_${this.currentStep}_${Date.now()}`,
      step: this.currentStep,
      timestamp: Date.now() - this.startTime,
      type: "NODE_EXECUTE",
      sourceNodeId: incomingEdge?.source,
      targetNodeId: nodeId,
      edgeId: incomingEdge?.id,
      payload: {
        nodeType: node.type,
        label: node.label ?? node.id,
        status: "success",
        memoryMb: Math.round(16 + Math.random() * 32),
        durationMs: Math.round(1.5 + Math.random() * 8),
      },
    };

    this.events.push(event);
    this.completedNodeIds.add(nodeId);

    if (this.onEventCallback) {
      this.onEventCallback(event);
    }

    // Queue outgoing connected nodes
    const outgoingEdges = this.document.edges.filter((e) => e.source === nodeId);
    for (const edge of outgoingEdges) {
      if (!this.visitedNodeIds.has(edge.target) && !this.executionQueue.includes(edge.target)) {
        this.executionQueue.push(edge.target);
      }
    }

    if (this.executionQueue.length === 0 && this.status === "running") {
      this.status = "completed";
      this.notifyStatus("completed");
    }

    return event;
  }

  public async run(): Promise<SimulationResult> {
    if (!this.document) {
      return {
        simulationId: `sim_${Date.now()}`,
        status: "failed",
        totalSteps: 0,
        durationMs: 0,
        events: [],
        error: "Simulation not initialized with a graph document",
      };
    }

    this.status = "running";
    this.notifyStatus("running");

    return new Promise((resolve) => {
      const executeNext = async () => {
        if (this.status !== "running") {
          resolve(this.createResult());
          return;
        }

        const evt = await this.step();
        if (!evt || this.executionQueue.length === 0) {
          this.status = "completed";
          this.notifyStatus("completed");
          resolve(this.createResult());
          return;
        }

        const delay = Math.round(600 / this.speedMultiplier);
        this.timer = setTimeout(executeNext, delay);
      };

      executeNext();
    });
  }

  public pause(): void {
    if (this.status === "running") {
      this.status = "paused";
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
      this.notifyStatus("paused");
    }
  }

  public resume(): void {
    if (this.status === "paused") {
      this.status = "running";
      this.notifyStatus("running");
      this.run();
    }
  }

  public reset(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.status = "idle";
    this.currentStep = 0;
    this.events = [];
    this.executionQueue = [];
    this.visitedNodeIds.clear();
    this.completedNodeIds.clear();
    this.notifyStatus("idle");
  }

  private notifyStatus(status: SimulationStatus): void {
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback(status);
    }
  }

  private createResult(): SimulationResult {
    return {
      simulationId: `sim_${this.startTime}`,
      status: this.status,
      totalSteps: this.currentStep,
      durationMs: Date.now() - this.startTime,
      events: [...this.events],
    };
  }
}
