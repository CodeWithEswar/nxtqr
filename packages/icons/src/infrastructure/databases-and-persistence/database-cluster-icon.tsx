import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const DatabaseClusterIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Database Cluster",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeTeal = isColored ? "#2DD4BF" : "#A3A3A3";
  const fillFoundation = isColored ? "#042F2E" : "#1A1A1A";
  const strokeAccent = isColored ? "#5EEAD4" : "#D4D4D4";
  const strokeRing = isColored ? "#14B8A6" : "#737373";
  const fillDot = isColored ? "#CCFBF1" : "#E5E5E5";

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
      {/* Cluster Quorum Synchronous Bus Ring */}
      <circle
        cx="16"
        cy="16"
        r="11"
        stroke={strokeRing}
        strokeWidth="1.2"
        strokeDasharray="2 2"
      />

      {/* Cluster Hub Center Indicator */}
      <circle cx="16" cy="16" r="1.5" fill={fillDot} />

      {/* Cluster Database Instance 1 (Top) */}
      <g transform="translate(16, 6)">
        <ellipse cx="0" cy="0" rx="4.5" ry="1.6" fill={fillFoundation} stroke={strokeTeal} strokeWidth="1.2" />
        <path d="M-4.5 0v3.5c0 .88 2.01 1.6 4.5 1.6s4.5-.72 4.5-1.6V0" stroke={strokeTeal} strokeWidth="1.2" />
      </g>

      {/* Cluster Database Instance 2 (Bottom-Left) */}
      <g transform="translate(8, 22)">
        <ellipse cx="0" cy="0" rx="4.5" ry="1.6" fill={fillFoundation} stroke={strokeTeal} strokeWidth="1.2" />
        <path d="M-4.5 0v3.5c0 .88 2.01 1.6 4.5 1.6s4.5-.72 4.5-1.6V0" stroke={strokeTeal} strokeWidth="1.2" />
      </g>

      {/* Cluster Database Instance 3 (Bottom-Right) */}
      <g transform="translate(24, 22)">
        <ellipse cx="0" cy="0" rx="4.5" ry="1.6" fill={fillFoundation} stroke={strokeTeal} strokeWidth="1.2" />
        <path d="M-4.5 0v3.5c0 .88 2.01 1.6 4.5 1.6s4.5-.72 4.5-1.6V0" stroke={strokeTeal} strokeWidth="1.2" />
      </g>

      {/* Inter-Node Gossip & Sync Traces */}
      <path
        d="M16 9.5L10 20.5M16 9.5l6 11M11 23.5h10"
        stroke={strokeAccent}
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
};

