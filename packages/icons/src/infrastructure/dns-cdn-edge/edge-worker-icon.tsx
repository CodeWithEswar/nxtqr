import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const EdgeWorkerIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Edge Worker",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeCore = isColored ? "#A78BFA" : "#A3A3A3";
  const fillCore = isColored ? "#3B0764" : "#1A1A1A";
  const strokeRing = isColored ? "#7C3AED" : "#525252";
  const fillNode = isColored ? "#6D28D9" : "#262626";
  const strokeNode = isColored ? "#C4B5FD" : "#737373";
  const fillCodePulse = isColored ? "#E9D5FF" : "#E5E5E5";
  const strokePin = isColored ? "#A78BFA" : "#737373";

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
      {/* Outer Event Loop Enclosure */}
      <circle cx="16" cy="16" r="12" stroke={strokeRing} strokeWidth="1" strokeDasharray="4 2" />

      {/* Compute Leads / Pin Connectors */}
      <line x1="16" y1="4" x2="16" y2="9" stroke={strokePin} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="16" y1="23" x2="16" y2="28" stroke={strokePin} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="4" y1="16" x2="9" y2="16" stroke={strokePin} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="23" y1="16" x2="28" y2="16" stroke={strokePin} strokeWidth="1.2" strokeLinecap="round" />

      {/* Diagonal Trigger Nodes */}
      <circle cx="7.5" cy="7.5" r="1.5" fill={fillNode} stroke={strokeNode} strokeWidth="1" />
      <circle cx="24.5" cy="7.5" r="1.5" fill={fillNode} stroke={strokeNode} strokeWidth="1" />
      <circle cx="7.5" cy="24.5" r="1.5" fill={fillNode} stroke={strokeNode} strokeWidth="1" />
      <circle cx="24.5" cy="24.5" r="1.5" fill={fillNode} stroke={strokeNode} strokeWidth="1" />

      {/* Central Isolate Core (Processor Diamond) */}
      <rect
        x="9"
        y="9"
        width="14"
        height="14"
        rx="2"
        fill={fillCore}
        stroke={strokeCore}
        strokeWidth="1.5"
      />

      {/* Lambda / Execution Code Symbol in Core */}
      <path
        d="M13 19l2.5-6h1l2.5 6M14 17h4"
        stroke={fillCodePulse}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
