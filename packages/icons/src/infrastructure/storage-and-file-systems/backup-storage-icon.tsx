import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const BackupStorageIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Backup Storage",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeAmber = isColored ? "#FBBF24" : "#A3A3A3";
  const fillDeep = isColored ? "#B45309" : "#262626";
  const fillFoundation = isColored ? "#451A03" : "#141414";
  const strokeAccent = isColored ? "#FDE68A" : "#E5E5E5";
  const fillVault = isColored ? "#78350F" : "#1F1F1F";

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
      {/* Tape / Disk Drive Storage Safe Chassis */}
      <rect
        x="4"
        y="5"
        width="24"
        height="22"
        rx="2.5"
        fill={fillFoundation}
        stroke={strokeAmber}
        strokeWidth="1.5"
      />

      {/* Backup Vault Status Shelf */}
      <path
        d="M4 10H28"
        stroke={strokeAmber}
        strokeWidth="1.2"
        strokeOpacity={isColored ? 0.7 : 0.4}
      />
      <circle cx="7.5" cy="7.5" r="1" fill={strokeAccent} />
      <circle cx="11" cy="7.5" r="1" fill={strokeAmber} />
      <path d="M22 7.5H25" stroke={strokeAccent} strokeWidth="1.2" strokeLinecap="round" />

      {/* Point-in-Time Recovery Circular Mechanism (Counter-Clockwise Restore Arrow) */}
      <g transform="translate(16, 18.5)">
        {/* Central Core Reel Hub */}
        <circle
          cx="0"
          cy="0"
          r="6.5"
          fill={fillVault}
          stroke={strokeAmber}
          strokeWidth="1.2"
          strokeDasharray="3 1.5"
        />

        {/* Circular Restore Flow Path */}
        <path
          d="M-2.5 -4.5A5.5 5.5 0 1 1 -5 1.5"
          stroke={strokeAccent}
          strokeWidth="1.4"
          strokeLinecap="round"
        />

        {/* Arrowhead at Restoration Return Point */}
        <path
          d="M-4.5 -4.5L-2 -4.8L-2 -2"
          stroke={strokeAccent}
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Inner Immutable Snapshot Lock Dot */}
        <circle cx="0" cy="0" r="2" fill={fillDeep} stroke={strokeAccent} strokeWidth="1" />
      </g>
    </svg>
  );
};
