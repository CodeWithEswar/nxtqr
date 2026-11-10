import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const UdpEndpointIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  className,
  ...props
}) => {
  const isMono = variant === "monochrome";

  const boundaryFill = isMono ? "#262626" : "#2B170B";
  const boundaryBorder = isMono ? "#525252" : "#EA580C";
  const primaryOrange = isMono ? "#FFFFFF" : "#FB923C";
  const secondaryOrange = isMono ? "#A3A3A3" : "#FED7AA";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="UDP Endpoint"
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
      <rect x="5.5" y="7.5" width="6" height="3" rx="0.5" fill={primaryOrange} />
      <path d="M14 8.5L25 8.5" stroke={secondaryOrange} strokeWidth="1" strokeDasharray="2 1.5" />

      {/* Independent Lightweight Datagram Bursts (No Handshake) */}
      {/* Datagram 1 */}
      <circle cx="8.5" cy="16" r="2.2" fill={primaryOrange} />
      <path d="M12 16H15" stroke={primaryOrange} strokeWidth="1.2" strokeLinecap="round" />

      {/* Datagram 2 (Dispersed/Asynchronous) */}
      <circle cx="16" cy="21" r="2.2" fill={secondaryOrange} />
      <path d="M19.5 21H23" stroke={secondaryOrange} strokeWidth="1.2" strokeLinecap="round" />

      {/* Datagram 3 */}
      <circle cx="23.5" cy="15.5" r="2.2" fill={primaryOrange} />
      <path d="M17 15.5H19.5" stroke={primaryOrange} strokeWidth="1.2" strokeLinecap="round" />

      {/* Direct Packet Vectors */}
      <path
        d="M6 21.5L10 21.5"
        stroke={secondaryOrange}
        strokeWidth="1"
        strokeLinecap="round"
        strokeDasharray="1.5 1.5"
      />
      <path
        d="M24 21.5L26.5 21.5"
        stroke={secondaryOrange}
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
};
