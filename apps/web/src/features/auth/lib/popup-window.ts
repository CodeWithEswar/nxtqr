import { AppError } from "./auth-errors";
import type { AuthCallbackMessage } from "../schemas/auth.schema";

export interface PopupOptions {
  url: string;
  attemptId: string;
  title?: string;
  width?: number;
  height?: number;
  timeoutMs?: number;
  onSuccess: () => void;
  onCancelled: () => void;
  onError: (error: AppError) => void;
}

export interface PopupController {
  close: () => void;
  isOpen: () => boolean;
}

export function calculateCenteredPopupCoordinates(width = 500, height = 620) {
  if (typeof window === "undefined") {
    return { left: 0, top: 0, width, height };
  }

  const screenLeft = window.screenLeft ?? window.screenX ?? 0;
  const screenTop = window.screenTop ?? window.screenY ?? 0;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth || screen.width;
  const windowHeight = window.innerHeight || document.documentElement.clientHeight || screen.height;

  const left = Math.max(0, Math.floor(screenLeft + (windowWidth - width) / 2));
  const top = Math.max(0, Math.floor(screenTop + (windowHeight - height) / 2));

  return { left, top, width, height };
}

export function openAuthPopup(options: PopupOptions): PopupController {
  const {
    url,
    attemptId,
    title = "Sign in with Google · NXTQR Studio",
    width = 500,
    height = 620,
    timeoutMs = 120000, // 2 minutes bounded lifetime
    onSuccess,
    onCancelled,
    onError,
  } = options;

  if (typeof window === "undefined") {
    onError(new AppError("SERVICE_UNAVAILABLE", "Window is undefined in server environment"));
    return { close: () => {}, isOpen: () => false };
  }

  const { left, top } = calculateCenteredPopupCoordinates(width, height);
  const windowFeatures = [
    `width=${width}`,
    `height=${height}`,
    `top=${top}`,
    `left=${left}`,
    "status=no",
    "resizable=yes",
    "scrollbars=yes",
    "personalbar=no",
    "toolbar=no",
    "menubar=no",
  ].join(",");

  let popup: Window | null = null;
  try {
    popup = window.open(url, title, windowFeatures);
  } catch {
    onError(new AppError("AUTH_POPUP_BLOCKED", "Browser prevented popup from opening"));
    return { close: () => {}, isOpen: () => false };
  }

  if (!popup || popup.closed || typeof popup.closed === "undefined") {
    onError(new AppError("AUTH_POPUP_BLOCKED", "Browser popup blocker active"));
    return { close: () => {}, isOpen: () => false };
  }

  // Focus popup
  try {
    popup.focus();
  } catch {
    // Window focus could be restricted by browser policy
  }

  let isHandled = false;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let timeoutTimer: ReturnType<typeof setTimeout> | null = null;

  const cleanup = () => {
    isHandled = true;
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    if (timeoutTimer) {
      clearTimeout(timeoutTimer);
      timeoutTimer = null;
    }
    window.removeEventListener("message", handleMessage);
  };

  const handleMessage = (event: MessageEvent) => {
    // Security check 1: Strict origin matching
    if (event.origin !== window.location.origin) {
      return;
    }

    // Security check 2: Strict source matching
    if (popup && event.source !== popup) {
      return;
    }

    const data = event.data as Partial<AuthCallbackMessage> | undefined;
    if (!data || data.type !== "NXTQR_AUTH_SUCCESS") {
      return;
    }

    // Correlation check: Match attemptId if supplied
    if (data.attemptId && data.attemptId !== attemptId) {
      return;
    }

    cleanup();
    try {
      if (popup && !popup.closed) {
        popup.close();
      }
    } catch {
      // Ignored
    }

    onSuccess();
  };

  window.addEventListener("message", handleMessage);

  // Poll for popup closure by user
  pollTimer = setInterval(() => {
    if (isHandled) return;

    if (!popup || popup.closed) {
      cleanup();
      // If closed by user without receiving message, handle as graceful cancellation
      onCancelled();
    }
  }, 450);

  // Enforce bounded attempt timeout
  timeoutTimer = setTimeout(() => {
    if (isHandled) return;

    cleanup();
    try {
      if (popup && !popup.closed) {
        popup.close();
      }
    } catch {
      // Ignored
    }
    onError(new AppError("AUTH_TIMEOUT", "Authentication attempt timed out. Please try again."));
  }, timeoutMs);

  return {
    close: () => {
      cleanup();
      try {
        if (popup && !popup.closed) {
          popup.close();
        }
      } catch {
        // Ignored
      }
    },
    isOpen: () => !!popup && !popup.closed,
  };
}

