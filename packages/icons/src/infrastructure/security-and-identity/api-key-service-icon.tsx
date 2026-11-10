import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const ApiKeyServiceIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "API Key Service",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeAmber = isColored ? "#FBBF24" : "#A3A3A3";
  const fillDeep = isColored ? "#78350F" : "#262626";
  const fillFoundation = isColored ? "#451A03" : "#141414";
  const strokeAccent = isColored ? "#FDE68A" : "#E5E5E5";
  const fillPlate = isColored ? "#92400E" : "#1F1F1F";

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
      {/* Credential Registry Base Chassis */}
      <rect
        x="4"
        y="4"
        width="24"
        height="24"
        rx="3"
        fill={fillFoundation}
        stroke={strokeAmber}
        strokeWidth="1.5"
      />

      {/* Registry Key Ledger Drawer */}
      <rect
        x="6.5"
        y="6.5"
        width="19"
        height="7.5"
        rx="1.5"
        fill={fillDeep}
        stroke={strokeAmber}
        strokeWidth="1.1"
      />
      {/* Ledger Scopes / Hashed Token Dots */}
      <circle cx="10" cy="10.25" r="1.2" fill={strokeAccent} />
      <line x1="13.5" y1="10.25" x2="22" y2="10.25" stroke={strokeAccent} strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2 1.5" />

      {/* Primary API Key Graphic (Bow, Stem, Bitting Teeth) */}
      <g transform="translate(6, 15.5)">
        {/* Key Bow */}
        <circle cx="5" cy="5" r="4" fill={fillPlate} stroke={strokeAmber} strokeWidth="1.3" />
        <circle cx="5" cy="5" r="1.5" fill={fillFoundation} stroke={strokeAccent} strokeWidth="1" />
        {/* Key Shaft / Stem */}
        <line x1="9" y1="5" x2="19" y2="5" stroke={strokeAccent} strokeWidth="2" strokeLinecap="round" />
        {/* Precision Cryptographic Bitting Bits */}
        <line x1="14" y1="5" x2="14" y2="8" stroke={strokeAccent} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="17.5" y1="5" x2="17.5" y2="8.5" stroke={strokeAccent} strokeWidth="1.5" strokeLinecap="round" />
      </g>

      {/* Active Lifecycle Indicator Dot */}
      <circle cx="24" cy="24" r="2.2" fill={fillDeep} stroke={strokeAccent} strokeWidth="1.2" />
      <circle cx="24" cy="24" r="0.8" fill={strokeAccent} />
    </svg>
  );
};
