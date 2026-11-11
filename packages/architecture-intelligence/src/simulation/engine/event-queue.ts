import type { SimulationEvent } from "../contracts/simulation.types";

export class SimulationEventQueue {
  private events: SimulationEvent[] = [];
  private sequenceCounter = 0;

  /**
   * Enqueues an event into the deterministic event queue.
   */
  public enqueue(
    event: Omit<SimulationEvent, "sequence"> & { sequence?: number }
  ): SimulationEvent {
    const sequence = event.sequence !== undefined ? event.sequence : ++this.sequenceCounter;
    const fullEvent: SimulationEvent = {
      ...event,
      sequence,
    };

    // Insert maintaining order:
    // 1. timestampMs ascending
    // 2. sequence ascending
    let insertIdx = this.events.length;
    for (let i = 0; i < this.events.length; i++) {
      if (
        fullEvent.timestampMs < this.events[i].timestampMs ||
        (fullEvent.timestampMs === this.events[i].timestampMs &&
          fullEvent.sequence < this.events[i].sequence)
      ) {
        insertIdx = i;
        break;
      }
    }

    this.events.splice(insertIdx, 0, fullEvent);
    return fullEvent;
  }

  public dequeue(): SimulationEvent | undefined {
    return this.events.shift();
  }

  public peek(): SimulationEvent | undefined {
    return this.events[0];
  }

  public get size(): number {
    return this.events.length;
  }

  public get isEmpty(): boolean {
    return this.events.length === 0;
  }

  /**
   * Drains all events scheduled at or before the given virtual timestamp.
   */
  public drainUpTo(targetTimestampMs: number): SimulationEvent[] {
    const ready: SimulationEvent[] = [];
    while (this.events.length > 0 && this.events[0].timestampMs <= targetTimestampMs) {
      ready.push(this.events.shift()!);
    }
    return ready;
  }

  public toSortedArray(): SimulationEvent[] {
    return [...this.events];
  }

  public clear(): void {
    this.events = [];
    this.sequenceCounter = 0;
  }
}
