import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const TimeSeriesDatabaseIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Time-Series Database",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeCyan = isColored ? "#38BDF8" : "#A3A3A3";
  const fillFoundation = isColored ? "#082F49" : "#1A1A1A";
  const strokeAccent = isColored ? "#7DD3FC" : "#D4D4D4";
  const strokeChart = isColored ? "#0284C7" : "#737373";
  const fillInner = isColored ? "#0C4A6E" : "#262626";
  const fillDot = isColored ? "#BAE6FD" : "#E5E5E5";

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
      {/* Top Database Disk Cap */}
      <ellipse
        cx="16"
        cy="6.5"
        rx="10.5"
        ry="3.2"
        fill={fillFoundation}
        stroke={strokeCyan}
        strokeWidth="1.5"
      />

      {/* Main Database Enclosure */}
      <path
        d="M5.5 6.5v17c0 1.77 4.7 3.2 10.5 3.2s10.5-1.43 10.5-3.2v-17"
        stroke={strokeCyan}
        strokeWidth="1.5"
      />

      {/* Middle Storage Stratum */}
      <path
        d="M5.5 12c0 1.77 4.7 3.2 10.5 3.2s10.5-1.43 10.5-3.2"
        stroke={strokeChart}
        strokeWidth="1.2"
      />

      {/* Time-Series Ingestion Scope Window */}
      <rect
        x="9"
        y="15"
        width="14"
        height="9"
        rx="1.5"
        fill={fillInner}
        stroke={strokeCyan}
        strokeWidth="1.1"
      />

      {/* Timestamp Horizon Axis & Time-Series Metric Curve */}
      <path d="M10.5 21.5h11" stroke={strokeChart} strokeWidth="1" strokeDasharray="1.5 1.5" />
      <path
        d="M10.5 20.5l2.5-3 3 2 3-4 2 3"
        stroke={strokeAccent}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Measurement Points */}
      <circle cx="13" cy="17.5" r="0.75" fill={fillDot} />
      <circle cx="16" cy="19.5" r="0.75" fill={fillDot} />
      <circle cx="19" cy="15.5" r="0.75" fill={fillDot} />
    </svg>
  );
};

