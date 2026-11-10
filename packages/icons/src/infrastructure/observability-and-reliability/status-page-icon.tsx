import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const StatusPageIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Status Page",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeIndigo = isColored ? "#818CF8" : "#A3A3A3";
  const fillDeep = isColored ? "#312E81" : "#262626";
  const fillFoundation = isColored ? "#1E1B4B" : "#141414";
  const strokeAccent = isColored ? "#C7D2FE" : "#E5E5E5";
  const strokeGreen = isColored ? "#34D399" : "#D4D4D4";
  const fillRow = isColored ? "#3730A3" : "#1F1F1F";

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
      {/* Public Status Page Display Frame */}
      <rect
        x="4"
        y="4"
        width="24"
        height="24"
        rx="3.5"
        fill={fillFoundation}
        stroke={strokeIndigo}
        strokeWidth="1.5"
      />

      {/* "All Systems Operational" Header Banner */}
      <rect x="6.5" y="6.5" width="19" height="5.5" rx="1.5" fill={fillDeep} stroke={strokeGreen} strokeWidth="1.1" />
      <circle cx="9.5" cy="9.25" r="1.3" fill={strokeGreen} />
      <line x1="13" y1="9.25" x2="22" y2="9.25" stroke={strokeGreen} strokeWidth="1.2" strokeLinecap="round" />

      {/* Service Component Availability Row 1 (API Services) */}
      <rect x="6.5" y="14" width="19" height="4" rx="1" fill={fillRow} stroke={strokeIndigo} strokeWidth="0.9" />
      <circle cx="9.5" cy="16" r="1" fill={strokeGreen} />
      <line x1="13" y1="16" x2="18" y2="16" stroke={strokeAccent} strokeWidth="1.1" strokeLinecap="round" />
      <line x1="21" y1="16" x2="23.5" y2="16" stroke={strokeGreen} strokeWidth="1.1" strokeLinecap="round" />

      {/* Service Component Availability Row 2 (Database & Storage) */}
      <rect x="6.5" y="19.5" width="19" height="4" rx="1" fill={fillRow} stroke={strokeIndigo} strokeWidth="0.9" />
      <circle cx="9.5" cy="21.5" r="1" fill={strokeGreen} />
      <line x1="13" y1="21.5" x2="19.5" y2="21.5" stroke={strokeAccent} strokeWidth="1.1" strokeLinecap="round" />
      <line x1="21.5" y1="21.5" x2="23.5" y2="21.5" stroke={strokeGreen} strokeWidth="1.1" strokeLinecap="round" />

      {/* Uptime Reliability Ticker Baseline */}
      <line x1="7" y1="25.5" x2="25" y2="25.5" stroke={strokeIndigo} strokeWidth="1.1" strokeDasharray="1.5 1.5" />
    </svg>
  );
};

