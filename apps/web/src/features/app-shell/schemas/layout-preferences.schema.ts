import { z } from "zod";

/**
 * NXTQR — Shell Layout Preferences Schema
 * Strict validation and versioning for persisted client workspace layout state.
 */
export const ShellLayoutPreferencesSchema = z.object({
  version: z.literal(1).default(1),
  sidebarWidth: z.number().min(208).max(360).default(248),
  sidebarCollapsed: z.boolean().default(false),
  secondaryPanelOpen: z.boolean().default(false),
  panelSizes: z.array(z.number()).default([20, 60, 20]),
  bottomPanelSize: z.number().min(10).max(50).default(25),
  bottomPanelOpen: z.boolean().default(false),
});

export type ShellLayoutPreferences = z.infer<typeof ShellLayoutPreferencesSchema>;

export const DEFAULT_LAYOUT_PREFERENCES: ShellLayoutPreferences = {
  version: 1,
  sidebarWidth: 248,
  sidebarCollapsed: false,
  secondaryPanelOpen: false,
  panelSizes: [20, 60, 20],
  bottomPanelSize: 25,
  bottomPanelOpen: false,
};

