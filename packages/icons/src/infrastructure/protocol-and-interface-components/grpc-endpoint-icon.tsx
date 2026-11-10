import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const GrpcEndpointIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  className,
  ...props
}) => {
  const isMono = variant === "monochrome";

  const boundaryFill = isMono ? "#262626" : "#141538";
  const boundaryBorder = isMono ? "#525252" : "#4F46E5";
  const primaryIndigo = isMono ? "#FFFFFF" : "#818CF8";
  const secondaryIndigo = isMono ? "#A3A3A3" : "#C7D2FE";
  const blockDark = isMono ? "#404040" : "#3730A3";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="gRPC Endpoint"
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

      {/* Protocol Header */}
      <path d="M3 11H29" stroke={boundaryBorder} strokeWidth="1" />
      <rect x="5.5" y="7.5" width="7" height="3" rx="0.5" fill={primaryIndigo} />
      <line x1="15" y1="9" x2="26" y2="9" stroke={secondaryIndigo} strokeWidth="1" strokeLinecap="round" />

      {/* Client Stub / Interface Block */}
      <rect
        x="6"
        y="14"
        width="5"
        height="10"
        rx="1"
        fill={blockDark}
        stroke={primaryIndigo}
        strokeWidth="1.2"
      />
      <circle cx="8.5" cy="17" r="0.8" fill="#FFFFFF" />
      <circle cx="8.5" cy="21" r="0.8" fill={secondaryIndigo} />

      {/* Binary Proto Stream Channel (Middle) */}
      {/* Call Forward Arrow */}
      <path
        d="M13 16.5H20M20 16.5L18 14.5M20 16.5L18 18.5"
        stroke={primaryIndigo}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Response Streaming Return Arrow */}
      <path
        d="M20 21.5H13M13 21.5L15 19.5M13 21.5L15 23.5"
        stroke={secondaryIndigo}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Server Implementation Service Block */}
      <rect
        x="21"
        y="14"
        width="5"
        height="10"
        rx="1"
        fill={blockDark}
        stroke={primaryIndigo}
        strokeWidth="1.2"
      />
      <circle cx="23.5" cy="17" r="0.8" fill={primaryIndigo} />
      <circle cx="23.5" cy="21" r="0.8" fill={secondaryIndigo} />
    </svg>
  );
};
