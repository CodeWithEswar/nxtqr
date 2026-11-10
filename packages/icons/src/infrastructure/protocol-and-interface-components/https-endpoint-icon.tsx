import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const HttpsEndpointIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  className,
  ...props
}) => {
  const isMono = variant === "monochrome";

  const boundaryFill = isMono ? "#262626" : "#06281C";
  const boundaryBorder = isMono ? "#525252" : "#059669";
  const primaryGreen = isMono ? "#FFFFFF" : "#34D399";
  const secondaryGreen = isMono ? "#A3A3A3" : "#A7F3D0";
  const lockShackle = isMono ? "#D4D4D4" : "#6EE7B7";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="HTTPS Endpoint"
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
      <path
        d="M3 11H29"
        stroke={boundaryBorder}
        strokeWidth="1.5"
      />

      {/* Integrated TLS Security Padlock (Header Left) */}
      <path
        d="M6.5 8.5V7C6.5 6.17157 7.17157 5.5 8 5.5C8.82843 5.5 9.5 6.17157 9.5 7V8.5"
        stroke={lockShackle}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <rect x="5.5" y="8" width="5" height="4" rx="1" fill={primaryGreen} />

      {/* Verified Secure Indicator Dot */}
      <circle cx="14" cy="8.5" r="1" fill={secondaryGreen} />

      {/* Encrypted Inbound Request Channel */}
      <path
        d="M6 16H18M18 16L15.5 13.5M18 16L15.5 18.5"
        stroke={primaryGreen}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Encrypted Outbound Response Channel */}
      <path
        d="M26 21H14M14 21L16.5 18.5M14 21L16.5 23.5"
        stroke={secondaryGreen}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* TLS Port Terminals */}
      <rect x="20.5" y="14.5" width="5.5" height="3" rx="0.5" fill={primaryGreen} />
      <rect x="6" y="19.5" width="5.5" height="3" rx="0.5" fill={secondaryGreen} />
    </svg>
  );
};
