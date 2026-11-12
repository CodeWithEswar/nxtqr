export interface QueueElement<T> {
  item: T;
  atMs: number;
  priority: number; // lower number = higher priority (0 > 10)
  sequence: number;
}

/**
 * Deterministic Min-Heap Priority Queue ordered by:
 * 1. Virtual timestamp (`atMs`) ascending
 * 2. Scheduling priority (`priority`) ascending
 * 3. Sequence / creation ID ascending
 */
export class PriorityQueue<T> {
  private heap: QueueElement<T>[] = [];

  public get size(): number {
    return this.heap.length;
  }

  public get isEmpty(): boolean {
    return this.heap.length === 0;
  }

  public push(item: T, atMs: number, priority = 5, sequence = 0): void {
    const element: QueueElement<T> = { item, atMs, priority, sequence };
    this.heap.push(element);
    this.bubbleUp(this.heap.length - 1);
  }

  public pop(): T | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0].item;
    const bottom = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = bottom;
      this.bubbleDown(0);
    }
    return top;
  }

  public peek(): T | undefined {
    return this.heap[0]?.item;
  }

  public peekElement(): QueueElement<T> | undefined {
    return this.heap[0];
  }

  public clear(): void {
    this.heap = [];
  }

  private compare(a: QueueElement<T>, b: QueueElement<T>): number {
    if (a.atMs !== b.atMs) {
      return a.atMs - b.atMs;
    }
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    return a.sequence - b.sequence;
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.compare(this.heap[index], this.heap[parentIndex]) < 0) {
        [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
        index = parentIndex;
      } else {
        break;
      }
    }
  }

  private bubbleDown(index: number): void {
    const length = this.heap.length;
    while (true) {
      let smallest = index;
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;

      if (leftChild < length && this.compare(this.heap[leftChild], this.heap[smallest]) < 0) {
        smallest = leftChild;
      }
      if (rightChild < length && this.compare(this.heap[rightChild], this.heap[smallest]) < 0) {
        smallest = rightChild;
      }

      if (smallest !== index) {
        [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
        index = smallest;
      } else {
        break;
      }
    }
  }
}
