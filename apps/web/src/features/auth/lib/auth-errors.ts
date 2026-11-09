import type { AppErrorCode } from "../schemas/auth.schema";
import { maskSensitiveData } from "@nxtqr/security";

export interface UserFacingError {
  code: AppErrorCode;
  title: string;
  message: string;
  recoverable: boolean;
  retryActionTitle?: string;
}

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly recoverable: boolean;
  readonly userMessage: string;

  constructor(code: AppErrorCode, message: string, userMessage?: string, recoverable = true) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.recoverable = recoverable;
    this.userMessage = userMessage || message;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

const ERROR_MESSAGE_MAP: Record<AppErrorCode, { title: string; message: string; recoverable: boolean; retryActionTitle?: string }> = {
  AUTH_CANCELLED: {
    title: "Sign-in Cancelled",
    message: "The authentication window was closed before completion. You can try again whenever you're ready.",
    recoverable: true,
    retryActionTitle: "Try Again",
  },
  AUTH_POPUP_BLOCKED: {
    title: "Popup Blocked by Browser",
    message: "Your browser prevented the Google authentication popup from opening. Please allow popups or use full-page sign-in.",
    recoverable: true,
    retryActionTitle: "Continue via Redirect",
  },
  AUTH_TIMEOUT: {
    title: "Authentication Timed Out",
    message: "The sign-in request took too long to complete. Please try signing in again.",
    recoverable: true,
    retryActionTitle: "Try Again",
  },
  AUTH_PROVIDER_ERROR: {
    title: "Authentication Provider Error",
    message: "Google was unable to complete the sign-in request. Please verify your connection or try again.",
    recoverable: true,
    retryActionTitle: "Retry Sign-in",
  },
  AUTH_SESSION_EXPIRED: {
    title: "Session Expired",
    message: "Your authentication session has expired. Please sign in again to access your workspace.",
    recoverable: true,
    retryActionTitle: "Sign In",
  },
  NETWORK_UNAVAILABLE: {
    title: "Network Offline",
    message: "Unable to reach the authentication service. Please check your internet connection.",
    recoverable: true,
    retryActionTitle: "Retry",
  },
  VALIDATION_ERROR: {
    title: "Validation Error",
    message: "The provided parameters failed validation constraints.",
    recoverable: false,
  },
  PERMISSION_DENIED: {
    title: "Access Restricted",
    message: "You do not have permission to access this project or resource.",
    recoverable: false,
  },
  RESOURCE_NOT_FOUND: {
    title: "Resource Not Found",
    message: "The requested project or profile could not be located.",
    recoverable: false,
  },
  RESOURCE_CONFLICT: {
    title: "Resource Conflict",
    message: "A resource with this identifier already exists.",
    recoverable: false,
  },
  RATE_LIMITED: {
    title: "Rate Limit Exceeded",
    message: "Too many sign-in attempts detected. Please wait a moment before trying again.",
    recoverable: true,
    retryActionTitle: "Retry Later",
  },
  SERVICE_UNAVAILABLE: {
    title: "Service Temporarily Unavailable",
    message: "The system is currently undergoing maintenance. Please retry in a few moments.",
    recoverable: true,
    retryActionTitle: "Retry",
  },
  UNKNOWN_ERROR: {
    title: "Authentication Failed",
    message: "An unexpected error occurred during sign-in. Please try again.",
    recoverable: true,
    retryActionTitle: "Try Again",
  },
};

export function formatAuthError(error: unknown): UserFacingError {
  if (error instanceof AppError) {
    const template = ERROR_MESSAGE_MAP[error.code] || ERROR_MESSAGE_MAP.UNKNOWN_ERROR;
    return {
      code: error.code,
      title: template.title,
      message: error.userMessage || template.message,
      recoverable: error.recoverable,
      retryActionTitle: template.retryActionTitle,
    };
  }

  if (typeof error === "object" && error !== null && "code" in error) {
    const rawCode = String((error as { code: unknown }).code);
    if (rawCode in ERROR_MESSAGE_MAP) {
      const template = ERROR_MESSAGE_MAP[rawCode as AppErrorCode];
      return {
        code: rawCode as AppErrorCode,
        title: template.title,
        message: template.message,
        recoverable: template.recoverable,
        retryActionTitle: template.retryActionTitle,
      };
    }
  }

  // Generic message parsing (never exposing stack traces or raw tokens)
  const rawMsg = error instanceof Error ? error.message : String(error);
  if (rawMsg.toLowerCase().includes("popup") && rawMsg.toLowerCase().includes("block")) {
    return {
      ...ERROR_MESSAGE_MAP.AUTH_POPUP_BLOCKED,
      code: "AUTH_POPUP_BLOCKED",
    };
  }
  if (rawMsg.toLowerCase().includes("timeout")) {
    return {
      ...ERROR_MESSAGE_MAP.AUTH_TIMEOUT,
      code: "AUTH_TIMEOUT",
    };
  }
  if (rawMsg.toLowerCase().includes("network") || rawMsg.toLowerCase().includes("fetch")) {
    return {
      ...ERROR_MESSAGE_MAP.NETWORK_UNAVAILABLE,
      code: "NETWORK_UNAVAILABLE",
    };
  }

  return {
    ...ERROR_MESSAGE_MAP.UNKNOWN_ERROR,
    code: "UNKNOWN_ERROR",
  };
}

export function logAuthEvent(category: string, operation: string, metadata?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === "production") {
    // In production, avoid noisy console logs while ensuring no secrets leak
    if (metadata) {
      maskSensitiveData(metadata);
    }
    return;
  }

  const safeData = metadata ? maskSensitiveData(metadata) : undefined;
  console.debug(`[NXTQR Auth:${category}] ${operation}`, safeData || "");
}

