import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const HttpEndpointIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  className,
  ...props
}) => {
  const isMono = variant === "monochrome";

  const boundaryFill = isMono ? "#262626" : "#0C2331";
  const boundaryBorder = isMono ? "#525252" : "#0284C7";
  const arrowReq = isMono ? "#FFFFFF" : "#38BDF8";
  const arrowRes = isMono ? "#A3A3A3" : "#BAE6FD";
  const detail = isMono ? "#737373" : "#0284C7";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="HTTP Endpoint"
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

      {/* Protocol Label Header Bar */}
      <path
        d="M3 11H29"
        stroke={boundaryBorder}
        strokeWidth="1.5"
      />
      <circle cx="6.5" cy="8" r="1" fill={arrowReq} />
      <circle cx="10" cy="8" r="1" fill={detail} />

      {/* Inbound Request Arrow (Top) */}
      <path
        d="M7 16H21M21 16L18 13.5M21 16L18 18.5"
        stroke={arrowReq}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Outbound Response Arrow (Bottom) */}
      <path
        d="M25 21H11M11 21L14 18.5M11 21L14 23.5"
        stroke={arrowRes}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Interface Port Terminals */}
      <rect x="23.5" y="14.5" width="3" height="3" rx="0.5" fill={arrowReq} />
      <rect x="5.5" y="19.5" width="3" height="3" rx="0.5" fill={arrowRes} />
    </svg>
  );
};
