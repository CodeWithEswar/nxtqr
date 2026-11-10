import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const BulkheadIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Bulkhead",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeBoundary = isColored ? "#38BDF8" : "#A3A3A3";
  const strokeAccent = isColored ? "#BAE6FD" : "#D4D4D4";
  const fillFoundation = isColored ? "#082F49" : "#141414";
  const fillCompartment = isColored ? "#0C4A6E" : "#1F1F1F";
  const barrierColor = isColored ? "#38BDF8" : "#E5E5E5";

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
      {/* Outer Hull / Chassis Boundary */}
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

      {/* Compartment A (Left Workload Chamber) */}
      <rect
        x="5.5"
        y="7"
        width="5.5"
        height="18"
        rx="2"
        fill={fillCompartment}
        stroke={strokeBoundary}
        strokeWidth="1"
      />
      <circle cx="8.25" cy="11" r="1.2" fill={strokeAccent} />
      <circle cx="8.25" cy="16" r="1.2" fill={strokeAccent} />
      <circle cx="8.25" cy="21" r="1.2" fill={strokeAccent} />

      {/* Reinforced Isolation Bulkhead Wall 1 */}
      <line
        x1="12.5"
        y1="6"
        x2="12.5"
        y2="26"
        stroke={barrierColor}
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* Compartment B (Center Workload Chamber) */}
      <rect
        x="14"
        y="7"
        width="5.5"
        height="18"
        rx="2"
        fill={fillCompartment}
        stroke={strokeBoundary}
        strokeWidth="1"
      />
      <circle cx="16.75" cy="11" r="1.2" fill={strokeAccent} />
      <circle cx="16.75" cy="16" r="1.2" fill={strokeAccent} />
      <circle cx="16.75" cy="21" r="1.2" fill={strokeAccent} />

      {/* Reinforced Isolation Bulkhead Wall 2 */}
      <line
        x1="21"
        y1="6"
        x2="21"
        y2="26"
        stroke={barrierColor}
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* Compartment C (Right Workload Chamber) */}
      <rect
        x="22.5"
        y="7"
        width="5.5"
        height="18"
        rx="2"
        fill={fillCompartment}
        stroke={strokeBoundary}
        strokeWidth="1"
      />
      <circle cx="25.25" cy="11" r="1.2" fill={strokeAccent} />
      <circle cx="25.25" cy="16" r="1.2" fill={strokeAccent} />
      <circle cx="25.25" cy="21" r="1.2" fill={strokeAccent} />
    </svg>
  );
};

BulkheadIcon.displayName = "BulkheadIcon";
