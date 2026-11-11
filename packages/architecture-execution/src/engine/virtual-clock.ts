export class VirtualClock {
  private currentTimeMs = 0;

  constructor(initialMs = 0) {
    this.currentTimeMs = initialMs;
  }

  public now(): number {
    return this.currentTimeMs;
  }

  public advance(durationMs: number): number {
    this.currentTimeMs += durationMs;
    return this.currentTimeMs;
  }

  public reset(toMs = 0): void {
    this.currentTimeMs = toMs;
  }
}
