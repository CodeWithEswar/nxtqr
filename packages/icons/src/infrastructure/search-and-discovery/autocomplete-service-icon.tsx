import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const AutocompleteServiceIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Autocomplete Service",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeAmber = isColored ? "#FBBF24" : "#A3A3A3";
  const strokeAccent = isColored ? "#FDE68A" : "#E5E5E5";
  const fillFoundation = isColored ? "#451A03" : "#141414";
  const fillDrop = isColored ? "#78350F" : "#262626";

  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden={decorative ? "true" : undefined}
      role={decorative ? "presentation" : "img"}
      {...props}
    >
      {!decorative && title && <title>{title}</title>}
      {/* Top Query Input Box */}
      <rect
        x="4"
        y="5"
        width="24"
        height="8"
        rx="2"
        fill={fillFoundation}
        stroke={strokeAmber}
        strokeWidth="1.4"
      />
      {/* Typed Prefix String */}
      <line x1="7.5" y1="9" x2="14" y2="9" stroke={strokeAccent} strokeWidth="1.6" strokeLinecap="round" />
      {/* Blinking Cursor Indicator */}
      <line x1="16.5" y1="7.2" x2="16.5" y2="10.8" stroke={strokeAmber} strokeWidth="1.4" strokeLinecap="round" />

      {/* Suggestion Dropdown Panel */}
      <path
        d="M6 13H26V26C26 27.1046 25.1046 28 24 28H8C6.89543 28 6 27.1046 6 26V13Z"
        fill={fillDrop}
        stroke={strokeAmber}
        strokeWidth="1.2"
      />

      {/* Suggestion Row 1 (Bold Prefix + Tail) */}
      <line x1="9" y1="17" x2="13.5" y2="17" stroke={strokeAccent} strokeWidth="1.6" strokeLinecap="round" />
      <line x1="15" y1="17" x2="22" y2="17" stroke={strokeAmber} strokeWidth="1.1" strokeLinecap="round" strokeDasharray="1.5 1.5" />

      {/* Suggestion Row 2 (Selected Suggestion) */}
      <rect x="8" y="19.5" width="16" height="4" rx="1" fill={fillFoundation} stroke={strokeAmber} strokeWidth="0.8" />
      <line x1="10" y1="21.5" x2="14.5" y2="21.5" stroke={strokeAccent} strokeWidth="1.6" strokeLinecap="round" />
      <line x1="16" y1="21.5" x2="21" y2="21.5" stroke={strokeAmber} strokeWidth="1.1" strokeLinecap="round" />

      {/* Suggestion Row 3 */}
      <line x1="9" y1="25.5" x2="13.5" y2="25.5" stroke={strokeAccent} strokeWidth="1.6" strokeLinecap="round" />
      <line x1="15" y1="25.5" x2="19" y2="25.5" stroke={strokeAmber} strokeWidth="1.1" strokeLinecap="round" strokeDasharray="1.5 1.5" />
    </svg>
  );
};
