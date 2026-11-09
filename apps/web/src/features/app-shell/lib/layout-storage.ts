import {
  ShellLayoutPreferencesSchema,
  DEFAULT_LAYOUT_PREFERENCES,
  type ShellLayoutPreferences,
} from "../schemas/layout-preferences.schema";

const STORAGE_KEY = "nxtqr_shell_preferences_v1";

/**
 * Loads and validates shell preferences from localStorage.
 * Safely falls back to default preferences if data is corrupt or running on the server.
 */
export function loadLayoutPreferences(): ShellLayoutPreferences {
  if (typeof window === "undefined") {
    return DEFAULT_LAYOUT_PREFERENCES;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_LAYOUT_PREFERENCES;
    }

    const parsed = JSON.parse(raw);
    const result = ShellLayoutPreferencesSchema.safeParse(parsed);

    if (!result.success) {
      console.warn("[NXTQR] Invalid shell layout preferences detected, resetting to defaults", result.error);
      return DEFAULT_LAYOUT_PREFERENCES;
    }

    return result.data;
  } catch (error) {
    console.warn("[NXTQR] Failed to parse shell layout preferences", error);
    return DEFAULT_LAYOUT_PREFERENCES;
  }
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Saves layout preferences to localStorage with debouncing.
 * Ensures pointer drag movements do not cause synchronous I/O thrashing.
 */
export function saveLayoutPreferences(
  preferences: Partial<ShellLayoutPreferences>,
  debounceMs: number = 250
): void {
  if (typeof window === "undefined") return;

  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(() => {
    try {
      const current = loadLayoutPreferences();
      const updated: ShellLayoutPreferences = {
        ...current,
        ...preferences,
        version: 1,
      };

      const valid = ShellLayoutPreferencesSchema.parse(updated);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
    } catch (error) {
      console.error("[NXTQR] Failed to persist layout preferences", error);
    }
  }, debounceMs);
}

/**
 * Clears stored layout preferences and resets to initial defaults.
 */
export function resetStoredLayoutPreferences(): ShellLayoutPreferences {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn("[NXTQR] Could not remove localStorage key", e);
    }
  }
  return DEFAULT_LAYOUT_PREFERENCES;
}
