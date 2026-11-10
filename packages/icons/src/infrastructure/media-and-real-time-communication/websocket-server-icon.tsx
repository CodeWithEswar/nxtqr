import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const WebSocketServerIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "WebSocket Server",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#38BDF8" : "#A3A3A3";
  const strokeAccent = isColored ? "#7DD3FC" : "#D4D4D4";
  const fillFoundation = isColored ? "#082F49" : "#141414";
  const fillSurface = isColored ? "#0C4A6E" : "#1F1F1F";

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
      {/* Central Server Chassis */}
      <rect
        x="9"
        y="8"
        width="14"
        height="16"
        rx="2"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.3"
      />
      {/* Server Slots / Bays */}
      <rect x="12" y="11" width="8" height="2.5" rx="0.5" fill={fillSurface} stroke={strokeAccent} strokeWidth="0.8" />
      <rect x="12" y="15" width="8" height="2.5" rx="0.5" fill={fillSurface} stroke={strokeAccent} strokeWidth="0.8" />
      <circle cx="18" cy="20.5" r="1" fill={isColored ? "#38BDF8" : "#A3A3A3"} />
      <circle cx="14" cy="20.5" r="1" fill={isColored ? "#34D399" : "#D4D4D4"} />

      {/* Persistent Full-Duplex Connection Arrows */}
      {/* Inbound Arrow (Left to Server) */}
      <path
        d="M3 13H7M7 13L5 11M7 13L5 15"
        stroke={strokeColor}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Outbound Arrow (Server to Left) */}
      <path
        d="M7 19H3M3 19L5 17M3 19L5 21"
        stroke={strokeAccent}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Right Persistent Connection Sync Loop */}
      <path
        d="M23 13H27M27 13L25 11M27 13L25 15"
        stroke={strokeColor}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M27 19H23M23 19L25 17M23 19L25 21"
        stroke={strokeAccent}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Top Persistent Heartbeat Indicator */}
      <path
        d="M12 4L14 6L16 3L18 6L20 4"
        stroke={strokeAccent}
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

