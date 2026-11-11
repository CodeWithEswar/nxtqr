import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const ServerRenderedAppIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Server-Side Rendered Application",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeServer = isColored ? "#60A5FA" : "#D4D4D4";
  const strokeClient = isColored ? "#93C5FD" : "#E5E5E5";
  const fillSlot1 = isColored ? "#38BDF8" : "#FFFFFF";
  const fillSlot2 = isColored ? "#60A5FA" : "#D4D4D4";
  const fillSlot3 = isColored ? "#A78BFA" : "#A3A3A3";
  const strokeArrow = isColored ? "#38BDF8" : "#E5E5E5";
  const fillPageHeader = isColored ? "#2563EB" : "#333333";
  const fillDomBlock1 = isColored ? "#38BDF8" : "#A3A3A3";
  const fillDomBlock2 = isColored ? "#A78BFA" : "#737373";

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
      {/* Left: Server Rack */}
      <rect
        x="2.5"
        y="6"
        width="10"
        height="20"
        rx="2"
        fill="#080808"
        stroke={strokeServer}
        strokeWidth="1.5"
      />
      {/* Server Slots */}
      <rect x="4.5" y="9" width="6" height="2" rx="0.5" fill={fillSlot1} />
      <rect x="4.5" y="13" width="6" height="2" rx="0.5" fill={fillSlot2} />
      <rect x="4.5" y="17" width="6" height="2" rx="0.5" fill={fillSlot3} />
      <circle cx="9" cy="22" r="0.75" fill={fillSlot1} />

      {/* Center: Hydration Render Stream Arrow */}
      <path
        d="M13.5 16h2.5m0 0l-1.25-1.25m1.25 1.25l-1.25 1.25"
        stroke={strokeArrow}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Right: Rendered HTML Client View */}
      <rect
        x="17"
        y="6"
        width="12.5"
        height="20"
        rx="2"
        fill="#080808"
        stroke={strokeClient}
        strokeWidth="1.5"
      />
      {/* Viewport Header */}
      <path
        d="M17 8a2 2 0 0 1 2-2h8.5a2 2 0 0 1 2 2v2H17V8z"
        fill={fillPageHeader}
      />
      {/* Hydrated DOM Blocks */}
      <rect x="19" y="12" width="8.5" height="4" rx="0.75" fill={fillDomBlock1} />
      <rect x="19" y="18" width="8.5" height="5.5" rx="0.75" fill={fillDomBlock2} />
    </svg>
  );
};

