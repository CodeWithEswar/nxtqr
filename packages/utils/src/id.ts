/**
 * Generates a random alphanumeric nano-like ID for temporary client-side elements.
 */
export function generateShortId(prefix = "nxt", length = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}_${result}`;
}
