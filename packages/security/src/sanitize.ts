/**
 * Strips script tags, javascript: URIs and dangerous dynamic execution vectors.
 */
export function sanitizeString(input: string): string {
  if (!input) return "";
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/javascript:[^\s]*/gi, "")
    .replace(/onload=[^\s]*/gi, "")
    .replace(/onerror=[^\s]*/gi, "");
}
