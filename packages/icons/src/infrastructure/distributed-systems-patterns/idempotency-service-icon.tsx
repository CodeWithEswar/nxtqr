import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const IdempotencyServiceIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Idempotency Service",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeBoundary = isColored ? "#34D399" : "#A3A3A3";
  const strokeAccent = isColored ? "#A7F3D0" : "#D4D4D4";
  const fillFoundation = isColored ? "#022C22" : "#141414";
  const fillSurface = isColored ? "#064E3B" : "#1F1F1F";
  const checkColor = isColored ? "#34D399" : "#E5E5E5";
  const filterColor = isColored ? "#F87171" : "#888888";

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
      {/* Outer Enclosure Frame */}
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

      {/* Internal Fingerprint / Key Vault Surface */}
      <rect
        x="6"
        y="7"
        width="20"
        height="18"
        rx="2.5"
        fill={fillSurface}
        stroke={strokeBoundary}
        strokeWidth="1"
      />

      {/* Primary First Request (Pass-through accepted) */}
      <path
        d="M8.5 11.5H16M16 11.5L14 9.5M16 11.5L14 13.5"
        stroke={strokeAccent}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Green Check for 1st execution */}
      <path
        d="M18.5 11.5L20 13L23 9.5"
        stroke={checkColor}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Divider Separator Line */}
      <line
        x1="8"
        y1="16"
        x2="24"
        y2="16"
        stroke={strokeBoundary}
        strokeWidth="1"
        strokeDasharray="2 1.5"
      />

      {/* Duplicate Replayed Request (Identical Key Detected) */}
      <path
        d="M8.5 20.5H16M16 20.5L14 18.5M16 20.5L14 22.5"
        stroke={filterColor}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Cached Response / Suppressed Execution Symbol (= Sign / Safe Replay) */}
      <line
        x1="19"
        y1="19.5"
        x2="23"
        y2="19.5"
        stroke={strokeAccent}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <line
        x1="19"
        y1="22"
        x2="23"
        y2="22"
        stroke={strokeAccent}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
};

IdempotencyServiceIcon.displayName = "IdempotencyServiceIcon";
