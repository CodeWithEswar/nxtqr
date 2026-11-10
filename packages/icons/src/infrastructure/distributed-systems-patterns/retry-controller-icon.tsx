import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const RetryControllerIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Retry Controller",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeBoundary = isColored ? "#FBBF24" : "#A3A3A3";
  const strokeAccent = isColored ? "#FEF08A" : "#D4D4D4";
  const fillFoundation = isColored ? "#451A03" : "#141414";
  const fillSurface = isColored ? "#78350F" : "#1F1F1F";
  const loopColor = isColored ? "#FBBF24" : "#E5E5E5";

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
      {/* Outer Controller Housing */}
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

      {/* Internal Center Core */}
      <circle
        cx="16"
        cy="16"
        r="10.5"
        fill={fillSurface}
        stroke={strokeBoundary}
        strokeWidth="1"
      />

      {/* Primary Circular Retry Arrow Loop */}
      <path
        d="M16 9.5C19.5 9.5 22.5 12.5 22.5 16C22.5 19.5 19.5 22.5 16 22.5C12.5 22.5 10 20 9.5 17"
        stroke={loopColor}
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* Retry Arrowhead */}
      <path
        d="M17.5 7L15 9.5L17.5 12"
        stroke={loopColor}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Attempt Counter Tally / Bounded Dots (1, 2, 3 Max Attempts) */}
      <circle cx="13" cy="16" r="1.3" fill={strokeAccent} />
      <circle cx="16" cy="16" r="1.3" fill={strokeAccent} />
      <circle cx="19" cy="16" r="1.3" fill={strokeAccent} />

      {/* Backoff / Jitter Waveform beneath */}
      <path
        d="M11 25.5H13L14.5 24L16 27L17.5 24L19 25.5H21"
        stroke={strokeAccent}
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

RetryControllerIcon.displayName = "RetryControllerIcon";

