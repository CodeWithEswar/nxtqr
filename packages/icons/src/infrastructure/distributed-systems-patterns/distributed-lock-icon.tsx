import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const DistributedLockIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Distributed Lock",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeBoundary = isColored ? "#60A5FA" : "#A3A3A3";
  const strokeAccent = isColored ? "#BFDBFE" : "#D4D4D4";
  const fillFoundation = isColored ? "#172554" : "#141414";
  const fillSurface = isColored ? "#1E3A8A" : "#1F1F1F";
  const lockColor = isColored ? "#60A5FA" : "#E5E5E5";
  const tokenColor = isColored ? "#FBBF24" : "#A3A3A3";

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
      {/* Outer Resource Boundary Frame */}
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

      {/* Lock Shackle (Curved U-Bar) */}
      <path
        d="M11.5 15V11C11.5 8.5 13.5 6.5 16 6.5C18.5 6.5 20.5 8.5 20.5 11V15"
        stroke={strokeAccent}
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Solid Padlock Body (Representing Mutual Exclusion Barrier) */}
      <rect
        x="9"
        y="14"
        width="14"
        height="12"
        rx="3"
        fill={fillSurface}
        stroke={lockColor}
        strokeWidth="1.4"
      />

      {/* Keyhole and Slot */}
      <circle cx="16" cy="18.5" r="1.5" fill={strokeAccent} />
      <path
        d="M16 20V22.5"
        stroke={strokeAccent}
        strokeWidth="1.3"
        strokeLinecap="round"
      />

      {/* Fencing Token Badge Indicator (Monotonically increasing sequence number) */}
      <rect
        x="19.5"
        y="11.5"
        width="7"
        height="5.5"
        rx="1.5"
        fill={fillFoundation}
        stroke={tokenColor}
        strokeWidth="1"
      />
      <path
        d="M21.5 14H24.5"
        stroke={tokenColor}
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
};

DistributedLockIcon.displayName = "DistributedLockIcon";

