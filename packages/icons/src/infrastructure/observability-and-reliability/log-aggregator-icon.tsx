import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const LogAggregatorIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Log Aggregator",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeOrange = isColored ? "#FB923C" : "#A3A3A3";
  const fillDeep = isColored ? "#7C2D12" : "#262626";
  const fillFoundation = isColored ? "#431407" : "#141414";
  const strokeAccent = isColored ? "#FED7AA" : "#E5E5E5";
  const fillCluster = isColored ? "#9A3412" : "#1F1F1F";

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
      {/* Central Log Aggregation Index Funnel / Cluster Chassis */}
      <rect
        x="4"
        y="4"
        width="24"
        height="24"
        rx="3.5"
        fill={fillFoundation}
        stroke={strokeOrange}
        strokeWidth="1.5"
      />

      {/* Multiple Converging Log Stream Ingress Pipes */}
      {/* Stream 1 (Left Top) */}
      <path d="M4 8.5H10L13.5 12" stroke={strokeOrange} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      {/* Stream 2 (Left Mid) */}
      <line x1="4" y1="16" x2="13.5" y2="16" stroke={strokeOrange} strokeWidth="1.3" strokeLinecap="round" />
      {/* Stream 3 (Left Bottom) */}
      <path d="M4 23.5H10L13.5 20" stroke={strokeOrange} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />

      {/* Central Aggregation & Ingestion Index Chamber */}
      <rect
        x="13.5"
        y="8.5"
        width="11.5"
        height="15"
        rx="2"
        fill={fillCluster}
        stroke={strokeAccent}
        strokeWidth="1.2"
      />

      {/* Indexed Log Chunk Slices */}
      <line x1="16" y1="12" x2="22.5" y2="12" stroke={strokeAccent} strokeWidth="1.3" strokeLinecap="round" />
      <line x1="16" y1="15" x2="21" y2="15" stroke={strokeOrange} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="16" y1="18" x2="22.5" y2="18" stroke={strokeAccent} strokeWidth="1.3" strokeLinecap="round" />

      {/* Compression & Search Index Marker */}
      <circle cx="21.5" cy="20.5" r="1.2" fill={fillDeep} stroke={strokeAccent} strokeWidth="1" />
    </svg>
  );
};

