/**
 * Checks if client user agent requests reduced motion.
 */
export function shouldReduceMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
