import type { AccentPresetId } from "@nxtqr/shared-types";

export interface AccentPresetDefinition {
  id: AccentPresetId;
  label: string;
  hex: string;
}

export const ACCENT_PRESETS: Record<AccentPresetId, AccentPresetDefinition> = {
  monochrome: {
    id: "monochrome",
    label: "Monochrome",
    hex: "#FFFFFF",
  },
  red: {
    id: "red",
    label: "Pure Red",
    hex: "#FF0000",
  },
  orange: {
    id: "orange",
    label: "Pure Orange",
    hex: "#FF6600",
  },
  yellow: {
    id: "yellow",
    label: "Pure Yellow",
    hex: "#FFD600",
  },
  amber: {
    id: "amber",
    label: "Pure Yellow",
    hex: "#FFD600",
  },
  green: {
    id: "green",
    label: "Pure Green",
    hex: "#00CC66",
  },
  blue: {
    id: "blue",
    label: "Pure Blue",
    hex: "#0066FF",
  },
  violet: {
    id: "violet",
    label: "Pure Violet",
    hex: "#8000FF",
  },
  pink: {
    id: "pink",
    label: "Pure Pink",
    hex: "#FF0099",
  },
};

/**
 * Filtered preset list ensuring Amber alias is deduplicated in UI palettes.
 */
export const ACCENT_PRESET_LIST: AccentPresetDefinition[] = [
  ACCENT_PRESETS.monochrome,
  ACCENT_PRESETS.red,
  ACCENT_PRESETS.orange,
  ACCENT_PRESETS.yellow,
  ACCENT_PRESETS.green,
  ACCENT_PRESETS.blue,
  ACCENT_PRESETS.violet,
  ACCENT_PRESETS.pink,
];
