import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const ServiceDiscoveryIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Service Discovery",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeBeacon = isColored ? "#34D399" : "#A3A3A3";
  const fillBeacon = isColored ? "#064E3B" : "#1A1A1A";
  const strokeRadar = isColored ? "#60A5FA" : "#737373";
  const strokeNode = isColored ? "#38BDF8" : "#525252";
  const fillNode = isColored ? "#0284C7" : "#262626";
  const fillAccent = isColored ? "#A7F3D0" : "#D4D4D4";

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
      {/* Outer Radar Waves */}
      <circle cx="16" cy="16" r="12" stroke={strokeRadar} strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
      <circle cx="16" cy="16" r="8" stroke={strokeRadar} strokeWidth="1" strokeDasharray="2 2" opacity="0.7" />

      {/* Central Service Registry Beacon */}
      <circle
        cx="16"
        cy="16"
        r="4"
        fill={fillBeacon}
        stroke={strokeBeacon}
        strokeWidth="1.5"
      />
      <circle cx="16" cy="16" r="1.5" fill={fillAccent} />

      {/* Registered Service Nodes (Discovered Endpoints) */}
      {/* Top Node */}
      <path d="M16 12V6" stroke={strokeBeacon} strokeWidth="1" strokeLinecap="round" />
      <circle cx="16" cy="5" r="2" fill={fillNode} stroke={strokeNode} strokeWidth="1" />

      {/* Bottom Left Node */}
      <path d="M13 18.5l-4.5 4" stroke={strokeBeacon} strokeWidth="1" strokeLinecap="round" />
      <circle cx="7.5" cy="23.5" r="2" fill={fillNode} stroke={strokeNode} strokeWidth="1" />

      {/* Bottom Right Node */}
      <path d="M19 18.5l4.5 4" stroke={strokeBeacon} strokeWidth="1" strokeLinecap="round" />
      <circle cx="24.5" cy="23.5" r="2" fill={fillNode} stroke={strokeNode} strokeWidth="1" />
    </svg>
  );
};
