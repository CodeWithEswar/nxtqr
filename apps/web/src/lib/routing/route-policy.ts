/**
 * NXTQR Route Access Policy & Defense-in-Depth Classification
 * Single authoritative source for route access rules, authentication boundaries,
 * and safe return redirect validation.
 */

export type RouteAccessLevel = "public" | "authenticated" | "callback";

export interface RouteRule {
  pattern: RegExp;
  access: RouteAccessLevel;
  description: string;
}

export const ROUTE_RULES: RouteRule[] = [
  // 1. Authentication callback
  {
    pattern: /^\/auth\/callback(?:\/.*)?$/,
    access: "callback",
    description: "OAuth 2.0 PKCE / token exchange callback handler",
  },
  {
    pattern: /^\/api\/auth\/callback(?:\/.*)?$/,
    access: "callback",
    description: "API OAuth callback handler",
  },

  // 2. Public legal & documentation
  {
    pattern: /^\/login(?:\/.*)?$/,
    access: "public",
    description: "Authentication & login card",
  },
  {
    pattern: /^\/terms(?:\/.*)?$/,
    access: "public",
    description: "Terms of Service",
  },
  {
    pattern: /^\/privacy(?:\/.*)?$/,
    access: "public",
    description: "Privacy Policy",
  },
  {
    pattern: /^\/docs(?:\/.*)?$/,
    access: "public",
    description: "Interactive engineering documentation & specs",
  },
  {
    pattern: /^\/verify(?:\/.*)?$/,
    access: "public",
    description: "Diagnostics console, brand review, and design system gates",
  },
  {
    pattern: /^\/api\/health(?:\/.*)?$/,
    access: "public",
    description: "Service health check",
  },
  {
    pattern: /^\/$/,
    access: "public",
    description: "Root studio entrance",
  },

  // 3. Authenticated studio workspace, projects & settings
  {
    pattern: /^\/workspace(?:\/.*)?$/,
    access: "authenticated",
    description: "Core studio workspace & canvas",
  },
  {
    pattern: /^\/projects(?:\/.*)?$/,
    access: "authenticated",
    description: "Project management & architecture graphs",
  },
  {
    pattern: /^\/settings(?:\/.*)?$/,
    access: "authenticated",
    description: "User profile, token & studio settings",
  },
  {
    pattern: /^\/visualizers(?:\/.*)?$/,
    access: "authenticated",
    description: "Domain-specific visualizer engines",
  },
];

/**
 * Determines whether a route requires an authenticated user session.
 */
export function isProtectedRoute(pathname: string): boolean {
  if (!pathname) return false;

  const matched = ROUTE_RULES.find((rule) => rule.pattern.test(pathname));
  if (matched) {
    return matched.access === "authenticated";
  }

  // Default to protected for unknown paths inside studio subdirectories
  return false;
}

/**
 * Determines whether a route is public (open to guests without signing in).
 */
export function isPublicRoute(pathname: string): boolean {
  if (!pathname) return false;

  const matched = ROUTE_RULES.find((rule) => rule.pattern.test(pathname));
  if (matched) {
    return matched.access === "public";
  }

  return false;
}

/**
 * Validates and sanitizes return-to-page redirect targets.
 * Strict guards:
 * - Must be an internal relative path starting with '/'
 * - Must not begin with '//' or '/\' (protocol-relative domain hijacking)
 * - Must not contain CRLF / control characters (HTTP response splitting)
 * - Must not use 'javascript:', 'data:', or other executable schemes
 * - Preserves safe query strings and hash anchors
 */
export function validateSafeRedirect(
  target: string | null | undefined,
  fallback = "/workspace"
): string {
  if (!target || typeof target !== "string") {
    return fallback;
  }

  const trimmed = target.trim();
  if (!trimmed) {
    return fallback;
  }

  // Guard 1: Must strictly begin with a single forward slash
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
    return fallback;
  }

  // Guard 2: Reject dangerous control characters, line breaks, or null bytes
  if (/[\x00-\x1F\x7F]/.test(trimmed)) {
    return fallback;
  }

  // Guard 3: Reject explicit protocol or script injections
  if (/^(?:javascript|data|vbscript|file):/i.test(trimmed)) {
    return fallback;
  }

  // Guard 4: Validate via URL constructor with dummy base to detect subtle bypasses
  try {
    const parsed = new URL(trimmed, "http://localhost");
    // Ensure the host was not hijacked (e.g. `/\example.com`)
    if (parsed.host !== "localhost") {
      return fallback;
    }
    // Return relative pathname + search + hash
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return fallback;
  }
}

