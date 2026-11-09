import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const AuthoritativeDnsIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Authoritative DNS",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeZone = isColored ? "#38BDF8" : "#A3A3A3";
  const fillBase = isColored ? "#0C4A6E" : "#1A1A1A";
  const fillTier1 = isColored ? "#0284C7" : "#262626";
  const fillTier2 = isColored ? "#0369A1" : "#1F1F1F";
  const fillDot = isColored ? "#7DD3FC" : "#D4D4D4";
  const fillApex = isColored ? "#38BDF8" : "#E5E5E5";
  const strokeDivider = isColored ? "#0369A1" : "#333333";

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
      {/* Authoritative Apex Source (Crown/Root Symbol) */}
      <path
        d="M16 4l4 4.5h-8L16 4z"
        fill={fillApex}
        stroke={strokeZone}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="7" r="1" fill="#080808" />

      {/* Main Authoritative Zone Repository Container */}
      <rect
        x="6"
        y="11"
        width="20"
        height="17"
        rx="2.5"
        fill={fillBase}
        stroke={strokeZone}
        strokeWidth="1.5"
      />

      {/* Top Tier: Primary SOA / Apex Records */}
      <rect x="8.5" y="13.5" width="15" height="4" rx="1" fill={fillTier1} />
      <circle cx="11" cy="15.5" r="1" fill={fillDot} />
      <line x1="14" y1="15.5" x2="21" y2="15.5" stroke={strokeZone} strokeWidth="1.2" strokeLinecap="round" />

      {/* Middle Tier: NS / MX Record Set */}
      <rect x="8.5" y="19" width="15" height="4" rx="1" fill={fillTier2} />
      <circle cx="11" cy="21" r="1" fill={fillDot} />
      <line x1="14" y1="21" x2="19" y2="21" stroke={fillDot} strokeWidth="1.2" strokeLinecap="round" />

      {/* Sovereign Anchor Bar / Security Seal */}
      <line x1="6" y1="24.5" x2="26" y2="24.5" stroke={strokeDivider} strokeWidth="1" />
      <rect x="13.5" y="24" width="5" height="2" rx="0.5" fill={fillApex} />
    </svg>
  );
};
