import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const BackgroundWorkerIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Background Worker",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeOrange = isColored ? "#FB923C" : "#A3A3A3";
  const fillWorker = isColored ? "#431407" : "#1A1A1A";
  const strokeAccent = isColored ? "#FDBA74" : "#D4D4D4";
  const fillInner = isColored ? "#7C2D12" : "#262626";
  const strokePath = isColored ? "#EA580C" : "#737373";
  const fillDot = isColored ? "#FFEDD5" : "#E5E5E5";

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
      {/* Upstream Task Message Queue Ingress Motif (Left) */}
      <rect
        x="3"
        y="11.5"
        width="6"
        height="9"
        rx="1.5"
        fill={fillInner}
        stroke={strokeOrange}
        strokeWidth="1.2"
      />
      <path d="M5 14h2M5 16.5h2" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" />

      {/* Task Flow Directional Conveyor Arrow */}
      <path
        d="M9 16h4.5M11.5 13.5l2.5 2.5-2.5 2.5"
        stroke={strokeAccent}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Main Worker Compute Engine Module (Right) */}
      <circle
        cx="21.5"
        cy="16"
        r="7.5"
        fill={fillWorker}
        stroke={strokeOrange}
        strokeWidth="1.5"
      />

      {/* Continuous Processing Turbine / Worker Cycle Spokes */}
      <path
        d="M21.5 11v3M21.5 18v3M16.5 16h3M24 16h3"
        stroke={strokePath}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="21.5" cy="16" r="2.2" fill={fillDot} />

      {/* Bottom Completion Indicator */}
      <circle cx="5" cy="24.5" r="1.25" fill={fillDot} />
      <circle cx="9" cy="24.5" r="1.25" fill={strokeAccent} />
    </svg>
  );
};
