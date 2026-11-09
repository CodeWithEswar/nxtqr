import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const MonolithicApplicationIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Monolithic Application",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeNeutral = isColored ? "#CBD5E1" : "#A3A3A3";
  const fillFoundation = isColored ? "#0F172A" : "#141414";
  const strokeViolet = isColored ? "#A78BFA" : "#737373";
  const fillModule = isColored ? "#1E293B" : "#202020";
  const fillCoreViolet = isColored ? "#2E1065" : "#262626";
  const fillAccent = isColored ? "#DDD6FE" : "#D4D4D4";
  const fillDot = isColored ? "#F8FAFC" : "#E5E5E5";

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
      {/* Unified Solid Enclosure (Monolith Boundary) */}
      <rect
        x="4.5"
        y="4.5"
        width="23"
        height="23"
        rx="3.5"
        fill={fillFoundation}
        stroke={strokeNeutral}
        strokeWidth="1.5"
      />

      {/* Internal Co-located Domain Modules (UI, Business Logic, Persistence, Jobs) */}
      <rect
        x="7.5"
        y="7.5"
        width="7.5"
        height="7.5"
        rx="1.5"
        fill={fillModule}
        stroke={strokeNeutral}
        strokeWidth="1"
      />
      <rect
        x="17"
        y="7.5"
        width="7.5"
        height="7.5"
        rx="1.5"
        fill={fillCoreViolet}
        stroke={strokeViolet}
        strokeWidth="1"
      />
      <rect
        x="7.5"
        y="17"
        width="7.5"
        height="7.5"
        rx="1.5"
        fill={fillCoreViolet}
        stroke={strokeViolet}
        strokeWidth="1"
      />
      <rect
        x="17"
        y="17"
        width="7.5"
        height="7.5"
        rx="1.5"
        fill={fillModule}
        stroke={strokeNeutral}
        strokeWidth="1"
      />

      {/* Internal Shared Memory / In-Process Bus */}
      <path
        d="M15 11.25h2M15 20.75h2M11.25 15v2M20.75 15v2"
        stroke={strokeViolet}
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Center Shared Runtime Kernel */}
      <circle cx="16" cy="16" r="1.5" fill={fillAccent} />
      <circle cx="9.5" cy="9.5" r="1" fill={fillDot} />
      <circle cx="22.5" cy="22.5" r="1" fill={fillDot} />
    </svg>
  );
};

