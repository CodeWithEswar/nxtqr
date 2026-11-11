export class VirtualClock {
  private _currentTimeMs: number;
  private readonly _startTimeMs: number;
  private readonly _endTimeMs: number;
  private readonly _resolutionMs: number;

  constructor(startTimeMs = 0, endTimeMs = 60_000, resolutionMs = 1_000) {
    this._startTimeMs = startTimeMs;
    this._currentTimeMs = startTimeMs;
    this._endTimeMs = endTimeMs;
    this._resolutionMs = Math.max(1, resolutionMs);
  }

  public get currentTimeMs(): number {
    return this._currentTimeMs;
  }

  public get startTimeMs(): number {
    return this._startTimeMs;
  }

  public get endTimeMs(): number {
    return this._endTimeMs;
  }

  public get resolutionMs(): number {
    return this._resolutionMs;
  }

  public get isFinished(): boolean {
    return this._currentTimeMs >= this._endTimeMs;
  }

  public get progressRatio(): number {
    const span = this._endTimeMs - this._startTimeMs;
    return span <= 0 ? 1 : Math.max(0, Math.min(1, (this._currentTimeMs - this._startTimeMs) / span));
  }

  public step(): number {
    this._currentTimeMs = Math.min(this._endTimeMs, this._currentTimeMs + this._resolutionMs);
    return this._currentTimeMs;
  }

  public seek(targetMs: number): number {
    this._currentTimeMs = Math.max(
      this._startTimeMs,
      Math.min(this._endTimeMs, targetMs)
    );
    return this._currentTimeMs;
  }

  public reset(): void {
    this._currentTimeMs = this._startTimeMs;
  }
}
