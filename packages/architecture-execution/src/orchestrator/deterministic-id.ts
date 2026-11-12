/**
 * Deterministic ID, Seeded PRNG, and Virtual Timestamp utilities for Phase 05.4.25.
 * Guarantees bit-for-bit reproducible runs across all Phase 05.4 simulation modules.
 */

export const DETERMINISTIC_EPOCH_ISO = "2026-11-12T00:00:00.000Z";
export const DETERMINISTIC_EPOCH_MS = Date.parse(DETERMINISTIC_EPOCH_ISO);

/**
 * Compute a deterministic, collision-resistant hexadecimal digest from arbitrary string input.
 */
export function computeDeterministicDigest(input: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < input.length; i += 1) {
    const ch = input.charCodeAt(i);
    h1 ^= ch;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= ch + ((i + 1) & 0xff);
    h2 = Math.imul(h2, 0x85ebca6b);
  }
  const part1 = (h1 >>> 0).toString(16).padStart(8, "0");
  const part2 = (h2 >>> 0).toString(16).padStart(8, "0");
  return `${part1}${part2}`;
}

/**
 * Compute a deterministic numeric seed from a string or number.
 */
export function normalizeSeed(seed: string | number): number {
  if (typeof seed === "number" && Number.isFinite(seed)) {
    return (Math.abs(Math.floor(seed)) || 1337) >>> 0;
  }
  const str = String(seed || "nxtqr-default-seed");
  let hash = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) || 1337;
}

/**
 * Deterministic Seeded PRNG (Mulberry32) with serializable state for checkpoints.
 */
export class DeterministicPrng {
  private state: number;

  constructor(seed: string | number = 1337) {
    this.state = normalizeSeed(seed);
  }

  public getState(): number {
    return this.state >>> 0;
  }

  public setState(state: number): void {
    this.state = state >>> 0;
  }

  public next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  public nextInt(minInclusive: number, maxInclusive: number): number {
    if (maxInclusive <= minInclusive) return minInclusive;
    return minInclusive + Math.floor(this.next() * (maxInclusive - minInclusive + 1));
  }

  public nextToken(length = 7): string {
    const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
    let out = "";
    for (let i = 0; i < length; i += 1) {
      out += alphabet[this.nextInt(0, alphabet.length - 1)];
    }
    return out;
  }
}

/**
 * Create a deterministic identifier using a seed and optional monotonic sequence index.
 */
export function createDeterministicId(
  prefix: string,
  seed: string | number,
  sequence = 0
): string {
  const digest = computeDeterministicDigest(`${seed}:${sequence}`).slice(0, 10);
  return sequence > 0 ? `${prefix}_${digest}_${sequence}` : `${prefix}_${digest}`;
}

/**
 * Create a deterministic ISO timestamp derived strictly from a virtual offset in milliseconds.
 */
export function createDeterministicIsoTimestamp(virtualOffsetMs = 0): string {
  const safeOffset = Number.isFinite(virtualOffsetMs) ? Math.max(0, Math.floor(virtualOffsetMs)) : 0;
  return new Date(DETERMINISTIC_EPOCH_MS + safeOffset).toISOString();
}

