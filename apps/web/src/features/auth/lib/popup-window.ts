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

function isWindowClosed(target: Window | null): boolean {
  if (!target) return true;
  try {
    return target.closed;
  } catch {
    // If browser COOP or cross-origin restrictions throw or block access,
    // the window is actively navigating on an external origin (e.g. Google Accounts).
    // It is NOT closed.
    return false;
  }
}

export function openAuthPopup(options: PopupOptions): PopupController {
  const {
    url,
    attemptId,
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
    popup = window.open(url, "nxtqr_auth_popup", windowFeatures);
  } catch {
    onError(new AppError("AUTH_POPUP_BLOCKED", "Browser prevented popup from opening"));
    return { close: () => {}, isOpen: () => false };
  }

  if (!popup || isWindowClosed(popup)) {
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
  let broadcastChannel: BroadcastChannel | null = null;

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
    window.removeEventListener("storage", handleStorage);
    if (broadcastChannel) {
      try {
        broadcastChannel.close();
      } catch {
        // Ignored
      }
      broadcastChannel = null;
    }
  };

  const handleMessage = (event: MessageEvent) => {
    // Security check 1: Strict origin matching
    if (event.origin !== window.location.origin) {
      return;
    }

    // Security check 2: Strict source matching (if source reference is accessible)
    if (popup && event.source && event.source !== popup) {
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
      if (popup && !isWindowClosed(popup)) {
        popup.close();
      }
    } catch {
      // Ignored
    }

    onSuccess();
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== "nxtqr_auth_sync" || !event.newValue) {
      return;
    }

    try {
      const data = JSON.parse(event.newValue) as Partial<AuthCallbackMessage>;
      if (data.type !== "NXTQR_AUTH_SUCCESS") return;
      if (data.attemptId && data.attemptId !== attemptId) return;

      cleanup();
      try {
        if (popup && !isWindowClosed(popup)) {
          popup.close();
        }
      } catch {
        // Ignored
      }

      onSuccess();
    } catch {
      // Ignored
    }
  };

  window.addEventListener("message", handleMessage);
  window.addEventListener("storage", handleStorage);

  // BroadcastChannel listener (works across same-origin windows even if COOP severed window.opener)
  if (typeof window !== "undefined" && "BroadcastChannel" in window) {
    try {
      broadcastChannel = new BroadcastChannel("nxtqr_auth_channel");
      broadcastChannel.onmessage = (event) => {
        const data = event.data as Partial<AuthCallbackMessage> | undefined;
        if (!data || data.type !== "NXTQR_AUTH_SUCCESS") return;
        if (data.attemptId && data.attemptId !== attemptId) return;

        cleanup();
        try {
          if (popup && !isWindowClosed(popup)) {
            popup.close();
          }
        } catch {
          // Ignored
        }

        onSuccess();
      };
    } catch {
      // Ignored
    }
  }

  // Poll for popup closure by user (using COOP-safe isWindowClosed)
  pollTimer = setInterval(() => {
    if (isHandled) return;

    if (isWindowClosed(popup)) {
      cleanup();
      // If closed by user without receiving message, handle as graceful cancellation
      onCancelled();
    }
  }, 650);

  // Enforce bounded attempt timeout
  timeoutTimer = setTimeout(() => {
    if (isHandled) return;

    cleanup();
    try {
      if (popup && !isWindowClosed(popup)) {
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
        if (popup && !isWindowClosed(popup)) {
          popup.close();
        }
      } catch {
        // Ignored
      }
    },
    isOpen: () => !!popup && !isWindowClosed(popup),
  };
}

