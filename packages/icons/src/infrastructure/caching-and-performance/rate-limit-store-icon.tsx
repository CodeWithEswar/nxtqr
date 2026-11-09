import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const RateLimitStoreIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Rate Limit Store",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeAmber = isColored ? "#FBBF24" : "#A3A3A3";
  const fillFoundation = isColored ? "#78350F" : "#1A1A1A";
  const strokeAccent = isColored ? "#FEF3C7" : "#E5E5E5";
  const strokeSubtle = isColored ? "#F59E0B" : "#737373";
  const fillBucket = isColored ? "#451A03" : "#262626";

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
      {/* Rate-Limit Counter Bucket Container */}
      <path
        d="M7 6h18l-2.5 20a2 2 0 01-2 1.75h-9a2 2 0 01-2-1.75L7 6z"
        fill={fillBucket}
        stroke={strokeAmber}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Top Bucket Rim */}
      <ellipse cx="16" cy="6" rx="9" ry="2" fill={fillFoundation} stroke={strokeAmber} strokeWidth="1.2" />

      {/* Threshold / Limit Ceiling Gauge Line */}
      <line
        x1="8.5"
        y1="12"
        x2="23.5"
        y2="12"
        stroke={strokeSubtle}
        strokeWidth="1.1"
        strokeDasharray="2 1.5"
      />

      {/* In-Memory Stored Token Coins (Sliding Window / Leaky Bucket Token Stack) */}
      <ellipse cx="16" cy="22" rx="5" ry="1.75" fill={fillFoundation} stroke={strokeAmber} strokeWidth="1.2" />
      <ellipse cx="16" cy="18" rx="5" ry="1.75" fill={fillFoundation} stroke={strokeAmber} strokeWidth="1.2" />
      <ellipse cx="16" cy="14" rx="5" ry="1.75" fill={fillFoundation} stroke={strokeAccent} strokeWidth="1.2" />

      {/* Incoming Request Token Refill Pulse */}
      <path
        d="M16 2v2.5"
        stroke={strokeAccent}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="16" cy="3" r="1" fill={strokeAccent} />

      {/* Storage Level Meter Tick (Right Side) */}
      <path
        d="M26 12h2.5M25 18h2.5M24 23h2.5"
        stroke={strokeAmber}
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
};
