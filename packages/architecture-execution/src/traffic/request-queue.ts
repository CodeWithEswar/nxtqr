import type {
  QueueAdmissionPolicy,
  ModeledTrafficQueue,
} from "./traffic-schemas";

export interface QueuedItem {
  requestId: string;
  enqueuedAtMs: number;
}

export class RequestQueueManager {
  private queueMap = new Map<string, QueuedItem[]>();

  public getOrCreateQueue(nodeId: string, _capacity?: number, _policy?: QueueAdmissionPolicy): QueuedItem[] {
    if (!this.queueMap.has(nodeId)) {
      this.queueMap.set(nodeId, []);
    }
    return this.queueMap.get(nodeId)!;
  }

  /**
   * Enqueues a request according to admission policy and capacity.
   */
  public enqueue(
    nodeId: string,
    requestId: string,
    atMs: number,
    stateQueue: ModeledTrafficQueue
  ): {
    admitted: boolean;
    currentDepth: number;
    reason?: string;
  } {
    const queue = this.getOrCreateQueue(nodeId, stateQueue.capacity, stateQueue.admissionPolicy);

    if (queue.length >= stateQueue.capacity) {
      stateQueue.rejectedCount++;
      return {
        admitted: false,
        currentDepth: queue.length,
        reason: `Queue on node "${nodeId}" reached maximum capacity (${stateQueue.capacity}). Request rejected.`,
      };
    }

    queue.push({ requestId, enqueuedAtMs: atMs });
    stateQueue.waitingCount = queue.length;
    stateQueue.totalEnqueuedCount++;

    return {
      admitted: true,
      currentDepth: queue.length,
    };
  }

  /**
   * Dequeues the next waiting request (FIFO) and computes queue wait time.
   */
  public dequeue(
    nodeId: string,
    atMs: number,
    stateQueue: ModeledTrafficQueue
  ): {
    item?: QueuedItem;
    waitTimeMs: number;
    remainingDepth: number;
  } {
    const queue = this.queueMap.get(nodeId);
    if (!queue || queue.length === 0) {
      stateQueue.waitingCount = 0;
      return { waitTimeMs: 0, remainingDepth: 0 };
    }

    const item = queue.shift()!;
    stateQueue.waitingCount = queue.length;
    const waitTimeMs = Math.max(0, atMs - item.enqueuedAtMs);

    return {
      item,
      waitTimeMs,
      remainingDepth: queue.length,
    };
  }

  public getDepth(nodeId: string): number {
    return this.queueMap.get(nodeId)?.length || 0;
  }

  public clear(): void {
    this.queueMap.clear();
  }
}
