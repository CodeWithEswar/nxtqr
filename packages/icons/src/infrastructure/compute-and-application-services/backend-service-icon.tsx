import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const BackendServiceIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Backend Service",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeIndigo = isColored ? "#818CF8" : "#A3A3A3";
  const fillModule = isColored ? "#1E1B4B" : "#1A1A1A";
  const strokeAccent = isColored ? "#C7D2FE" : "#D4D4D4";
  const fillInner = isColored ? "#3730A3" : "#262626";
  const strokePort = isColored ? "#A5B4FC" : "#737373";
  const fillDot = isColored ? "#E0E7FF" : "#E5E5E5";

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
      {/* External Service Module Enclosure */}
      <rect
        x="6.5"
        y="6.5"
        width="19"
        height="19"
        rx="3.5"
        fill={fillModule}
        stroke={strokeIndigo}
        strokeWidth="1.5"
      />

      {/* Internal Functional Service Tier */}
      <rect
        x="10.5"
        y="10.5"
        width="11"
        height="11"
        rx="2"
        fill={fillInner}
        stroke={strokeAccent}
        strokeWidth="1.2"
      />

      {/* Core Logic Dot */}
      <circle cx="16" cy="16" r="1.5" fill={fillDot} />

      {/* Input Port Interface (Left) */}
      <path d="M2.5 16h4" stroke={strokePort} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="2.5" cy="16" r="1.25" fill={fillDot} />

      {/* Output Port Interface (Right) */}
      <path d="M25.5 16h4" stroke={strokePort} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="29.5" cy="16" r="1.25" fill={fillDot} />

      {/* Dependency Interface (Bottom) */}
      <path d="M16 25.5v3.5" stroke={strokePort} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="16" cy="29.5" r="1.25" fill={fillDot} />
    </svg>
  );
};
