import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const WebRtcSignalingServerIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "WebRTC Signaling Server",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#A78BFA" : "#A3A3A3";
  const strokeAccent = isColored ? "#C4B5FD" : "#D4D4D4";
  const fillFoundation = isColored ? "#2E1065" : "#141414";
  const fillSurface = isColored ? "#4C1D95" : "#1F1F1F";

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
      {/* Central Signaling Hub Node */}
      <circle
        cx="16"
        cy="10"
        r="5.5"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.3"
      />
      <circle cx="16" cy="10" r="2" fill={strokeAccent} />

      {/* Peer Endpoint A (Left) */}
      <rect
        x="3"
        y="21"
        width="8"
        height="8"
        rx="2"
        fill={fillSurface}
        stroke={strokeColor}
        strokeWidth="1.2"
      />
      <circle cx="7" cy="25" r="1.5" fill={strokeAccent} />

      {/* Peer Endpoint B (Right) */}
      <rect
        x="21"
        y="21"
        width="8"
        height="8"
        rx="2"
        fill={fillSurface}
        stroke={strokeColor}
        strokeWidth="1.2"
      />
      <circle cx="25" cy="25" r="1.5" fill={strokeAccent} />

      {/* SDP Offer / Answer Signaling Vectors (Dashed session negotiation paths) */}
      <path
        d="M7 21C7 16 11 13 13 12"
        stroke={strokeColor}
        strokeWidth="1.2"
        strokeDasharray="2 1.5"
        strokeLinecap="round"
      />
      <path
        d="M25 21C25 16 21 13 19 12"
        stroke={strokeColor}
        strokeWidth="1.2"
        strokeDasharray="2 1.5"
        strokeLinecap="round"
      />

      {/* Direct Peer-to-Peer Media Candidate Trajectory (Bottom Bridge) */}
      <path
        d="M11 25H21"
        stroke={strokeAccent}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M14 23L16 25L14 27"
        stroke={strokeColor}
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 23L16 25L18 27"
        stroke={strokeColor}
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

