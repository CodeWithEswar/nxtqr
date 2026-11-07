/**
 * Invariant assertion. Throws an Error with message if condition is falsy.
 */
export function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`[NXTQR Invariant Violation] ${message}`);
  }
}

/**
 * Asserts value is neither null nor undefined.
 */
export function assertNonNull<T>(
  value: T | null | undefined,
  message?: string,
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message ?? "[NXTQR Invariant Violation] Value cannot be null or undefined");
  }
}
