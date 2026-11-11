/**
 * Deterministic Seeded Pseudo-Random Number Generator (Mulberry32).
 * Ensures that all simulated network jitter, retry randomization, and
 * failure cascades are 100% reproducible for a given scenario seed.
 */
export class DeterministicRandom {
  private state: number;

  constructor(seed = 1337) {
    this.state = seed >>> 0;
  }

  /**
   * Generates a floating point random number in [0, 1).
   */
  public next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Generates an integer in range [min, max] inclusive.
   */
  public nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Evaluates probability check (e.g. 0.05 for 5% chance).
   */
  public testChance(probability: number): boolean {
    return this.next() < probability;
  }

  public chance(probability: number): boolean {
    return this.testChance(probability);
  }
}
