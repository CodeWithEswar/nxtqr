import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const DistributedSchedulerIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Distributed Scheduler",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeBoundary = isColored ? "#2DD4BF" : "#A3A3A3";
  const strokeAccent = isColored ? "#99F6E4" : "#D4D4D4";
  const fillFoundation = isColored ? "#042F2E" : "#141414";
  const fillSurface = isColored ? "#115E59" : "#1F1F1F";
  const clockColor = isColored ? "#2DD4BF" : "#E5E5E5";

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
      {/* Outer Schedule Grid Boundary */}
      <rect
        x="3"
        y="4"
        width="26"
        height="24"
        rx="4"
        fill={fillFoundation}
        stroke={strokeBoundary}
        strokeWidth="1.2"
      />

      {/* Central Cron Clock Dial */}
      <circle
        cx="16"
        cy="15"
        r="7.5"
        fill={fillSurface}
        stroke={clockColor}
        strokeWidth="1.3"
      />

      {/* Clock Hands (indicating Cron Execution Trigger) */}
      <path
        d="M16 11.5V15L18.5 16.5"
        stroke={strokeAccent}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="15" r="1.1" fill={strokeAccent} />

      {/* Ticking Ticks (12, 3, 6, 9) */}
      <line x1="16" y1="8" x2="16" y2="9.2" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" />
      <line x1="22.5" y1="15" x2="21.3" y2="15" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" />
      <line x1="16" y1="22" x2="16" y2="20.8" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" />
      <line x1="9.5" y1="15" x2="10.7" y2="15" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" />

      {/* Distributed Worker Dispatch Nodes (Bottom row) */}
      <circle cx="9" cy="25.5" r="1.8" fill={fillSurface} stroke={strokeBoundary} strokeWidth="1" />
      <circle cx="16" cy="25.5" r="1.8" fill={fillSurface} stroke={strokeAccent} strokeWidth="1" />
      <circle cx="23" cy="25.5" r="1.8" fill={fillSurface} stroke={strokeBoundary} strokeWidth="1" />

      {/* Dispatch Trigger Lines to Worker Nodes */}
      <path
        d="M12 21.5L9 23.5M16 22.5V23.5M20 21.5L23 23.5"
        stroke={strokeAccent}
        strokeWidth="1"
        strokeLinecap="round"
        strokeDasharray="1.5 1.5"
      />
    </svg>
  );
};

DistributedSchedulerIcon.displayName = "DistributedSchedulerIcon";
