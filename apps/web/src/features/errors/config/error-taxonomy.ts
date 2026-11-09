export type AppErrorCode =
  | "UNAUTHENTICATED"
  | "SESSION_EXPIRED"
  | "PERMISSION_DENIED"
  | "RESOURCE_NOT_FOUND"
  | "PROJECT_UNAVAILABLE"
  | "INVALID_ROUTE"
  | "NETWORK_UNAVAILABLE"
  | "SERVICE_UNAVAILABLE"
  | "RATE_LIMITED"
  | "PROJECT_LOAD_FAILED"
  | "PROJECT_SAVE_FAILED"
  | "UNEXPECTED_ERROR";

export interface ErrorDisplayConfig {
  code: AppErrorCode;
  httpStatus?: number;
  title: string;
  description: string;
  primaryActionLabel: string;
  primaryActionHref?: string;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
  visualVariant: "not-found" | "error" | "restricted" | "service-unavailable";
}

export const ERROR_DISPLAY_REGISTRY: Record<AppErrorCode, ErrorDisplayConfig> = {
  INVALID_ROUTE: {
    code: "INVALID_ROUTE",
    httpStatus: 404,
    title: "Page not found",
    description: "The page you're looking for doesn't exist or may have moved.",
    primaryActionLabel: "Return to Workspace",
    primaryActionHref: "/workspace",
    secondaryActionLabel: "Studio Documentation",
    secondaryActionHref: "/docs",
    visualVariant: "not-found",
  },
  RESOURCE_NOT_FOUND: {
    code: "RESOURCE_NOT_FOUND",
    httpStatus: 404,
    title: "Resource not found",
    description: "The requested resource could not be found or has been deleted.",
    primaryActionLabel: "Return to Workspace",
    primaryActionHref: "/workspace",
    visualVariant: "not-found",
  },
  PROJECT_UNAVAILABLE: {
    code: "PROJECT_UNAVAILABLE",
    httpStatus: 404,
    title: "Project unavailable",
    description: "This project doesn't exist or you no longer have access to it.",
    primaryActionLabel: "View Projects",
    primaryActionHref: "/workspace/projects",
    secondaryActionLabel: "Return to Workspace",
    secondaryActionHref: "/workspace",
    visualVariant: "not-found",
  },
  PERMISSION_DENIED: {
    code: "PERMISSION_DENIED",
    httpStatus: 403,
    title: "Access denied",
    description: "You don't have permission to access this resource.",
    primaryActionLabel: "Return to Workspace",
    primaryActionHref: "/workspace",
    secondaryActionLabel: "Switch Account",
    secondaryActionHref: "/login",
    visualVariant: "restricted",
  },
  UNAUTHENTICATED: {
    code: "UNAUTHENTICATED",
    httpStatus: 401,
    title: "Authentication required",
    description: "Sign in with your NXTQR account to access this studio workspace.",
    primaryActionLabel: "Sign In",
    primaryActionHref: "/login",
    visualVariant: "restricted",
  },
  SESSION_EXPIRED: {
    code: "SESSION_EXPIRED",
    httpStatus: 401,
    title: "Session expired",
    description: "Your session has expired. Sign in again to continue working without losing unsaved changes.",
    primaryActionLabel: "Continue with Google",
    primaryActionHref: "/login",
    visualVariant: "restricted",
  },
  SERVICE_UNAVAILABLE: {
    code: "SERVICE_UNAVAILABLE",
    httpStatus: 503,
    title: "Service temporarily unavailable",
    description: "NXTQR couldn't complete your request right now. Please try again shortly.",
    primaryActionLabel: "Try Again",
    visualVariant: "service-unavailable",
  },
  NETWORK_UNAVAILABLE: {
    code: "NETWORK_UNAVAILABLE",
    title: "Connection interrupted",
    description: "Network connectivity was lost. Reconnecting to NXTQR telemetry...",
    primaryActionLabel: "Retry Connection",
    visualVariant: "service-unavailable",
  },
  RATE_LIMITED: {
    code: "RATE_LIMITED",
    httpStatus: 429,
    title: "Rate limit reached",
    description: "Too many requests. Please wait a moment before trying again.",
    primaryActionLabel: "Return to Workspace",
    primaryActionHref: "/workspace",
    visualVariant: "restricted",
  },
  PROJECT_LOAD_FAILED: {
    code: "PROJECT_LOAD_FAILED",
    title: "Failed to load project",
    description: "An unexpected error occurred while loading graph architecture telemetry.",
    primaryActionLabel: "Try Again",
    secondaryActionLabel: "View Projects",
    secondaryActionHref: "/workspace/projects",
    visualVariant: "error",
  },
  PROJECT_SAVE_FAILED: {
    code: "PROJECT_SAVE_FAILED",
    title: "Failed to save project",
    description: "Unable to persist graph changes to remote storage.",
    primaryActionLabel: "Retry Save",
    visualVariant: "error",
  },
  UNEXPECTED_ERROR: {
    code: "UNEXPECTED_ERROR",
    httpStatus: 500,
    title: "Something went wrong",
    description: "An unexpected error prevented this page from loading.",
    primaryActionLabel: "Try Again",
    secondaryActionLabel: "Return to Workspace",
    secondaryActionHref: "/workspace",
    visualVariant: "error",
  },
};
