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
    hex: "#FAFAFA",
  },
  red: {
    id: "red",
    label: "Red",
    hex: "#E5484D",
  },
  orange: {
    id: "orange",
    label: "Orange",
    hex: "#F28C52",
  },
  amber: {
    id: "amber",
    label: "Amber",
    hex: "#E9AD46",
  },
  green: {
    id: "green",
    label: "Green",
    hex: "#48B98A",
  },
  blue: {
    id: "blue",
    label: "Blue",
    hex: "#579DFF",
  },
  violet: {
    id: "violet",
    label: "Violet",
    hex: "#A78BFA",
  },
  pink: {
    id: "pink",
    label: "Pink",
    hex: "#E879B9",
  },
};

export const ACCENT_PRESET_LIST: AccentPresetDefinition[] = Object.values(ACCENT_PRESETS);
