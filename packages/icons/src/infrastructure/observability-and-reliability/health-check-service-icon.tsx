import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const HealthCheckServiceIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Health Check Service",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeTeal = isColored ? "#2DD4BF" : "#A3A3A3";
  const fillDeep = isColored ? "#134E4A" : "#262626";
  const fillFoundation = isColored ? "#042F2E" : "#141414";
  const strokeAccent = isColored ? "#99F6E4" : "#E5E5E5";
  const strokeGreen = isColored ? "#34D399" : "#D4D4D4";

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
      {/* Target Service Perimeter Shield / Uptime Guard */}
      <circle cx="16" cy="16" r="12" fill={fillFoundation} stroke={strokeTeal} strokeWidth="1.5" />

      {/* Internal Verification Chamber */}
      <circle cx="16" cy="16" r="8.5" fill={fillDeep} stroke={strokeAccent} strokeWidth="1.1" strokeDasharray="3 2" />

      {/* Synthetic Heartbeat Probe EKG Pulse Vector */}
      <path
        d="M6 16H10.5L13 11.5L16 20.5L18.5 13.5L21 16H26"
        stroke={strokeTeal}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Verified Uptime Success Checkmark Badge */}
      <g transform="translate(19.5, 6)">
        <circle cx="3" cy="3" r="3.5" fill={fillFoundation} stroke={strokeGreen} strokeWidth="1.2" />
        <path
          d="M1.8 3L2.7 3.9L4.4 2.1"
          stroke={strokeGreen}
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
};

