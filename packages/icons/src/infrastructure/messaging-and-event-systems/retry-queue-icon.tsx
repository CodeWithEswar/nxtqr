import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const RetryQueueIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Retry Queue",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeAmber = isColored ? "#FBBF24" : "#A3A3A3";
  const fillFoundation = isColored ? "#451A03" : "#1A1A1A";
  const strokeAccent = isColored ? "#FEF08A" : "#E5E5E5";
  const fillMessage = isColored ? "#78350F" : "#262626";

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
      {/* Delayed Retry Queue Base Enclosure */}
      <rect
        x="3"
        y="12"
        width="14"
        height="14"
        rx="2.5"
        fill={fillFoundation}
        stroke={strokeAmber}
        strokeWidth="1.4"
      />

      {/* Pending Retry Message Envelopes */}
      <rect
        x="5.5"
        y="14.5"
        width="9"
        height="4"
        rx="1"
        fill={fillMessage}
        stroke={strokeAccent}
        strokeWidth="1.1"
      />
      <rect
        x="5.5"
        y="19.5"
        width="9"
        height="4"
        rx="1"
        fill={fillMessage}
        stroke={strokeAmber}
        strokeWidth="1.1"
      />

      {/* Exponential Backoff / Time Delay Loop (Right) */}
      <circle
        cx="23"
        cy="19"
        r="6.5"
        fill={fillFoundation}
        stroke={strokeAmber}
        strokeWidth="1.4"
      />
      {/* Clock Delay Hands */}
      <path
        d="M23 15.5v3.5l2.5 1.5"
        stroke={strokeAccent}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Recirculating Retry Loop Path (From Clock to Queue Head) */}
      <path
        d="M23 12.5A6.5 6.5 0 0 0 17 8H10a4 4 0 0 0-4 4"
        stroke={strokeAccent}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      {/* Re-enqueue Arrowhead */}
      <path
        d="M4.5 10L6 12l1.5-2"
        stroke={strokeAccent}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Bounded Attempt Counter Dots */}
      <circle cx="21" cy="27.5" r="1" fill={strokeAmber} />
      <circle cx="23" cy="27.5" r="1" fill={strokeAmber} />
      <circle cx="25" cy="27.5" r="1" fill={strokeAccent} />
    </svg>
  );
};
