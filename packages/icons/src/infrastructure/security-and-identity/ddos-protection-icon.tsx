import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const DdosProtectionIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "DDoS Protection",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeAmber = isColored ? "#FBBF24" : "#A3A3A3";
  const strokeRed = isColored ? "#F87171" : "#8A8A8A";
  const fillDeep = isColored ? "#78350F" : "#262626";
  const fillFoundation = isColored ? "#451A03" : "#141414";
  const strokeAccent = isColored ? "#FDE68A" : "#E5E5E5";
  const strokeGreen = isColored ? "#34D399" : "#C4C4C4";

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
      {/* Volumetric Ingress Threat Vector Rays (Flooding Attacks) */}
      <path d="M4 6L13 11" stroke={strokeRed} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M3 11L13 13" stroke={strokeRed} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M3 16L12 16" stroke={strokeRed} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3 21L13 19" stroke={strokeRed} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M4 26L13 21" stroke={strokeRed} strokeWidth="1.3" strokeLinecap="round" />

      {/* Scrubbing Center Deflector Shield Barrier */}
      <path
        d="M14 4.5C14 4.5 19 8 19 16C19 24 14 27.5 14 27.5V4.5Z"
        fill={fillFoundation}
        stroke={strokeAmber}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Internal Absorption Core */}
      <path
        d="M15.5 7.5C15.5 7.5 17.5 10 17.5 16C17.5 22 15.5 24.5 15.5 24.5V7.5Z"
        fill={fillDeep}
        stroke={strokeAccent}
        strokeWidth="1"
      />

      {/* Clean Scrubbed Traffic Pipeline & Exit Channel */}
      <rect
        x="20.5"
        y="12.5"
        width="8"
        height="7"
        rx="2"
        fill={fillFoundation}
        stroke={strokeAmber}
        strokeWidth="1.2"
      />

      {/* Purified Outgoing Stream Beam */}
      <line x1="22" y1="16" x2="27" y2="16" stroke={strokeGreen} strokeWidth="2" strokeLinecap="round" />
      <path
        d="M25 14L27.5 16L25 18"
        stroke={strokeGreen}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Scrubbing Sensor Nodes */}
      <circle cx="16.5" cy="12" r="0.8" fill={strokeAccent} />
      <circle cx="16.5" cy="20" r="0.8" fill={strokeAccent} />
    </svg>
  );
};
