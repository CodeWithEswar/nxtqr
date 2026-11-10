import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const TcpEndpointIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  className,
  ...props
}) => {
  const isMono = variant === "monochrome";

  const boundaryFill = isMono ? "#262626" : "#281C08";
  const boundaryBorder = isMono ? "#525252" : "#D97706";
  const primaryAmber = isMono ? "#FFFFFF" : "#FBBF24";
  const secondaryAmber = isMono ? "#A3A3A3" : "#FDE68A";
  const trackDark = isMono ? "#404040" : "#78350F";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="TCP Endpoint"
      {...props}
    >
      {/* Endpoint Boundary Box */}
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
      <rect x="5.5" y="7.5" width="6" height="3" rx="0.5" fill={primaryAmber} />
      <circle cx="15" cy="8.5" r="0.8" fill={secondaryAmber} />
      <circle cx="18" cy="8.5" r="0.8" fill={secondaryAmber} />
      <circle cx="21" cy="8.5" r="0.8" fill={secondaryAmber} />

      {/* Reliable Ordered Byte-Stream Track */}
      <rect
        x="5.5"
        y="14"
        width="21"
        height="10.5"
        rx="1.5"
        fill={trackDark}
        stroke={boundaryBorder}
        strokeWidth="1"
      />

      {/* Sequenced Byte Packets in Stream [01] [02] [03] [04] */}
      <rect x="7" y="16" width="3.5" height="6.5" rx="0.8" fill={primaryAmber} />
      <rect x="12" y="16" width="3.5" height="6.5" rx="0.8" fill={primaryAmber} />
      <rect x="17" y="16" width="3.5" height="6.5" rx="0.8" fill={secondaryAmber} />
      <rect x="22" y="16" width="3" height="6.5" rx="0.8" fill={secondaryAmber} />

      {/* Handshake / Reliable ACK Flow Indicator */}
      <path
        d="M8.5 24.5H23.5"
        stroke={primaryAmber}
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
};
