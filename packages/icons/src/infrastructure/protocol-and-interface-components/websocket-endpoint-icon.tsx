import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const WebsocketEndpointIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  className,
  ...props
}) => {
  const isMono = variant === "monochrome";

  const boundaryFill = isMono ? "#262626" : "#0A2624";
  const boundaryBorder = isMono ? "#525252" : "#0D9488";
  const primaryTeal = isMono ? "#FFFFFF" : "#2DD4BF";
  const secondaryTeal = isMono ? "#A3A3A3" : "#99F6E4";
  const tunnelFill = isMono ? "#404040" : "#115E59";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="WebSocket Endpoint"
      {...props}
    >
      {/* Endpoint Container */}
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

      {/* Protocol Header Bar */}
      <path d="M3 11H29" stroke={boundaryBorder} strokeWidth="1" />
      <circle cx="6.5" cy="8" r="1" fill={primaryTeal} />
      <path d="M10 8H17" stroke={secondaryTeal} strokeWidth="1" strokeLinecap="round" />
      <circle cx="25" cy="8" r="1.2" fill={primaryTeal} />

      {/* Persistent Full-Duplex Tunnel Channel */}
      <rect
        x="5.5"
        y="14"
        width="21"
        height="10"
        rx="2"
        fill={tunnelFill}
        stroke={primaryTeal}
        strokeWidth="1"
        strokeDasharray="2.5 1.5"
      />

      {/* Full-Duplex Upstream Arrow */}
      <path
        d="M9 17.5H23M23 17.5L20 15.5M23 17.5L20 19.5"
        stroke={primaryTeal}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Full-Duplex Downstream Arrow */}
      <path
        d="M23 20.5H9M9 20.5L12 18.5M9 20.5L12 22.5"
        stroke={secondaryTeal}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
