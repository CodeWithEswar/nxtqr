import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const StreamingEndpointIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  className,
  ...props
}) => {
  const isMono = variant === "monochrome";

  const boundaryFill = isMono ? "#262626" : "#2B1114";
  const boundaryBorder = isMono ? "#525252" : "#DC2626";
  const primaryRed = isMono ? "#FFFFFF" : "#F87171";
  const secondaryRed = isMono ? "#A3A3A3" : "#FECACA";
  const trackDark = isMono ? "#404040" : "#7F1D1D";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Streaming Endpoint"
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

      {/* Protocol Header Bar */}
      <path d="M3 11H29" stroke={boundaryBorder} strokeWidth="1" />
      <rect x="5.5" y="7.5" width="7" height="3" rx="0.5" fill={primaryRed} />
      <circle cx="16" cy="8.5" r="0.8" fill={secondaryRed} />
      <circle cx="19" cy="8.5" r="0.8" fill={secondaryRed} />
      <circle cx="25" cy="8.5" r="1.2" fill={primaryRed} />

      {/* Continuous Stream Pipeline Channel */}
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

      {/* Sequential Streaming Frame Slices */}
      <rect x="7" y="16" width="2.5" height="6.5" rx="0.5" fill={primaryRed} />
      <rect x="11" y="16" width="2.5" height="6.5" rx="0.5" fill={primaryRed} />
      <rect x="15" y="16" width="2.5" height="6.5" rx="0.5" fill={secondaryRed} />
      <rect x="19" y="16" width="2.5" height="6.5" rx="0.5" fill={secondaryRed} />

      {/* Continuous Stream Output Egress Arrow */}
      <path
        d="M23 19.25L25.5 19.25M25.5 19.25L24 17.5M25.5 19.25L24 21"
        stroke="#FFFFFF"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
