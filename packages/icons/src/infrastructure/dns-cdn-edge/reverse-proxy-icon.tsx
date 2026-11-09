import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const ReverseProxyIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Reverse Proxy",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeBoundary = isColored ? "#2DD4BF" : "#A3A3A3";
  const fillBoundary = isColored ? "#042F2E" : "#1A1A1A";
  const strokePath = isColored ? "#14B8A6" : "#525252";
  const strokeBackend = isColored ? "#5EEAD4" : "#737373";
  const fillDot = isColored ? "#99F6E4" : "#D4D4D4";
  const fillShield = isColored ? "#0F766E" : "#262626";

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
      {/* Client-Facing Requests Ingress Line */}
      <path d="M4 16h7" stroke={strokePath} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="4.5" cy="16" r="1.5" fill={fillDot} />

      {/* Central Proxy Mediation Membrane / Boundary */}
      <rect
        x="11"
        y="6"
        width="10"
        height="20"
        rx="2.5"
        fill={fillBoundary}
        stroke={strokeBoundary}
        strokeWidth="1.5"
      />

      {/* Internal Security / TLS Termination Shield Pattern */}
      <path
        d="M16 10l3 1.5v3.5c0 2-1.5 3.5-3 4-1.5-.5-3-2-3-4v-3.5L16 10z"
        fill={fillShield}
        stroke={strokeBoundary}
        strokeWidth="1"
        strokeLinejoin="round"
      />

      {/* Multiplexed Upstream Egress Channels (Right) */}
      {/* Top Backend Path */}
      <path d="M21 12h4c1 0 2 .5 2 1.5V14" stroke={strokeBackend} strokeWidth="1.2" strokeLinecap="round" />
      <rect x="25.5" y="13.5" width="4" height="3" rx="0.5" fill={fillShield} stroke={strokeBackend} strokeWidth="0.8" />

      {/* Center Backend Path */}
      <path d="M21 16h4.5" stroke={strokeBackend} strokeWidth="1.2" strokeLinecap="round" />
      <rect x="25.5" y="14.5" width="4" height="3" rx="0.5" fill={fillShield} stroke={strokeBackend} strokeWidth="0.8" />

      {/* Bottom Backend Path */}
      <path d="M21 20h4c1 0 2-.5 2-1.5V18" stroke={strokeBackend} strokeWidth="1.2" strokeLinecap="round" />
      <rect x="25.5" y="15.5" width="4" height="3" rx="0.5" fill={fillShield} stroke={strokeBackend} strokeWidth="0.8" />
    </svg>
  );
};

