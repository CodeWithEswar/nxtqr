import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const ApplicationServerIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Application Server",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeViolet = isColored ? "#A78BFA" : "#A3A3A3";
  const fillChassis = isColored ? "#3B0764" : "#1A1A1A";
  const strokeAccent = isColored ? "#DDD6FE" : "#D4D4D4";
  const fillAccent = isColored ? "#6B21A8" : "#262626";
  const fillCore = isColored ? "#C4B5FD" : "#E5E5E5";
  const strokePath = isColored ? "#818CF8" : "#737373";

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
      {/* Top Stacked Compute Unit */}
      <rect
        x="4.5"
        y="4.5"
        width="23"
        height="10"
        rx="2"
        fill={fillChassis}
        stroke={strokeViolet}
        strokeWidth="1.5"
      />
      <circle cx="8.5" cy="9.5" r="1.5" fill={fillCore} />
      <path d="M13 9.5h10.5" stroke={strokeAccent} strokeWidth="1.5" strokeLinecap="round" />

      {/* Bottom Processing Engine Chassis */}
      <rect
        x="4.5"
        y="17.5"
        width="23"
        height="10"
        rx="2"
        fill={fillChassis}
        stroke={strokeViolet}
        strokeWidth="1.5"
      />
      <circle cx="8.5" cy="22.5" r="1.5" fill={fillCore} />

      {/* Internal Processor Core / Execution Logic Motif */}
      <rect
        x="13"
        y="19.5"
        width="6"
        height="6"
        rx="1"
        fill={fillAccent}
        stroke={strokeViolet}
        strokeWidth="1"
      />
      <circle cx="16" cy="22.5" r="1" fill={fillCore} />

      {/* Compute Interconnect Bus */}
      <path
        d="M22 21h2.5M22 24h2.5M16 14.5v3"
        stroke={strokePath}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
};

