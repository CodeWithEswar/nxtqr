import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const SecretsManagerIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Secrets Manager",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeLavender = isColored ? "#C4B5FD" : "#A3A3A3";
  const fillDeep = isColored ? "#581C87" : "#262626";
  const fillFoundation = isColored ? "#3B0764" : "#141414";
  const strokeAccent = isColored ? "#E9D5FF" : "#E5E5E5";
  const fillDial = isColored ? "#6B21A8" : "#1F1F1F";

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
      {/* Heavy Armored Security Vault Chassis */}
      <rect
        x="4"
        y="4"
        width="24"
        height="24"
        rx="4"
        fill={fillFoundation}
        stroke={strokeLavender}
        strokeWidth="1.5"
      />

      {/* Vault Door Bolting Rim */}
      <rect
        x="6.5"
        y="6.5"
        width="19"
        height="19"
        rx="2.5"
        fill={fillDeep}
        stroke={strokeLavender}
        strokeWidth="1.1"
      />

      {/* Precision Corner Locking Bolts */}
      <circle cx="8.5" cy="8.5" r="0.9" fill={strokeAccent} />
      <circle cx="23.5" cy="8.5" r="0.9" fill={strokeAccent} />
      <circle cx="8.5" cy="23.5" r="0.9" fill={strokeAccent} />
      <circle cx="23.5" cy="23.5" r="0.9" fill={strokeAccent} />

      {/* Central Combination Safe Lock Wheel */}
      <circle cx="16" cy="16" r="6" fill={fillDial} stroke={strokeAccent} strokeWidth="1.3" />
      <circle cx="16" cy="16" r="3.2" fill={fillFoundation} stroke={strokeLavender} strokeWidth="1.1" />

      {/* Rotary Dial Ticks */}
      <line x1="16" y1="10.8" x2="16" y2="12" stroke={strokeAccent} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="21.2" y1="16" x2="20" y2="16" stroke={strokeAccent} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="16" y1="21.2" x2="16" y2="20" stroke={strokeAccent} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="10.8" y1="16" x2="12" y2="16" stroke={strokeAccent} strokeWidth="1.2" strokeLinecap="round" />

      {/* Secret Enclosure Keyhole Core */}
      <circle cx="16" cy="15.2" r="0.9" fill={strokeAccent} />
      <polygon points="15.4,15.2 16.6,15.2 16.3,17.2 15.7,17.2" fill={strokeAccent} />
    </svg>
  );
};
