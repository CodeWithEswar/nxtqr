import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const EventSubscriptionIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  className,
  ...props
}) => {
  const isMono = variant === "monochrome";

  const boundaryFill = isMono ? "#262626" : "#0A281E";
  const boundaryBorder = isMono ? "#525252" : "#059669";
  const primaryGreen = isMono ? "#FFFFFF" : "#34D399";
  const secondaryGreen = isMono ? "#A3A3A3" : "#A7F3D0";
  const channelFill = isMono ? "#404040" : "#064E3B";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Event Subscription"
      {...props}
    >
      {/* Endpoint Boundary */}
      <rect
        x="3"
        y="5"
        width="26"
        height="22"
        rx="3"
        fill={boundaryFill}
        stroke={boundaryBorder}
        strokeWidth="1.5"
      />

      {/* Header Bar */}
      <path d="M3 11H29" stroke={boundaryBorder} strokeWidth="1" />
      <circle cx="6.5" cy="8" r="1" fill={primaryGreen} />
      <line x1="9.5" y1="8" x2="16.5" y2="8" stroke={secondaryGreen} strokeWidth="1" strokeLinecap="round" />

      {/* Source Event Stream Track (Left) */}
      <rect
        x="6"
        y="14"
        width="4.5"
        height="10.5"
        rx="1"
        fill={channelFill}
        stroke={secondaryGreen}
        strokeWidth="1"
      />
      <circle cx="8.2" cy="16.5" r="0.8" fill="#FFFFFF" />
      <circle cx="8.2" cy="19.2" r="0.8" fill={primaryGreen} />
      <circle cx="8.2" cy="22" r="0.8" fill={secondaryGreen} />

      {/* Subscription Tap / Filter Hook (Middle) */}
      <path
        d="M10.5 19.2H16M16 19.2L16 16.5M16 16.5H20M20 16.5L18 14.5M20 16.5L18 18.5"
        stroke={primaryGreen}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Filtered Consumer Delivery Box (Right) */}
      <rect
        x="21"
        y="14"
        width="5"
        height="10.5"
        rx="1.2"
        fill={channelFill}
        stroke={primaryGreen}
        strokeWidth="1.2"
      />
      <line x1="22.5" y1="17" x2="24.5" y2="17" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" />
      <line x1="22.5" y1="20" x2="24.5" y2="20" stroke={primaryGreen} strokeWidth="1" strokeLinecap="round" />
      <line x1="22.5" y1="22.5" x2="24.5" y2="22.5" stroke={secondaryGreen} strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
};
