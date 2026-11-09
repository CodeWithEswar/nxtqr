import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const MicroserviceIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Microservice",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeViolet = isColored ? "#A78BFA" : "#A3A3A3";
  const fillCore = isColored ? "#2E1065" : "#1A1A1A";
  const strokeAccent = isColored ? "#DDD6FE" : "#D4D4D4";
  const fillNode = isColored ? "#581C87" : "#262626";
  const fillDot = isColored ? "#C4B5FD" : "#E5E5E5";
  const strokeTraces = isColored ? "#818CF8" : "#737373";

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
      {/* 4 Cross Traces connecting to satellite endpoints */}
      <path
        d="M16 4v5M16 23v5M4 16h5M23 16h5"
        stroke={strokeTraces}
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* 4 Satellite Connection Terminals */}
      <circle cx="16" cy="4" r="1.5" fill={fillDot} />
      <circle cx="16" cy="28" r="1.5" fill={fillDot} />
      <circle cx="4" cy="16" r="1.5" fill={fillDot} />
      <circle cx="28" cy="16" r="1.5" fill={fillDot} />

      {/* Central Autonomous Microservice Block */}
      <rect
        x="9"
        y="9"
        width="14"
        height="14"
        rx="3"
        fill={fillCore}
        stroke={strokeViolet}
        strokeWidth="1.5"
      />

      {/* Internal Microservice Core Silhouette */}
      <rect
        x="12"
        y="12"
        width="8"
        height="8"
        rx="1.5"
        fill={fillNode}
        stroke={strokeAccent}
        strokeWidth="1"
      />
      <circle cx="16" cy="16" r="1.5" fill={fillDot} />
    </svg>
  );
};
