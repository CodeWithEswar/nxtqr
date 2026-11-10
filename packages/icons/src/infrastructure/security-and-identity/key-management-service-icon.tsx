import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const KeyManagementServiceIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Key Management Service",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeOrange = isColored ? "#FB923C" : "#A3A3A3";
  const fillDeep = isColored ? "#7C2D12" : "#262626";
  const fillFoundation = isColored ? "#431407" : "#141414";
  const strokeAccent = isColored ? "#FED7AA" : "#E5E5E5";
  const fillCore = isColored ? "#9A3412" : "#1F1F1F";

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
      {/* Hardware Security Module (HSM) Octagonal Boundary */}
      <polygon
        points="10,3.5 22,3.5 28.5,10 28.5,22 22,28.5 10,28.5 3.5,22 3.5,10"
        fill={fillFoundation}
        stroke={strokeOrange}
        strokeWidth="1.5"
      />

      {/* Key Rotation Orbit Ring (360-degree lifecycle arrow path) */}
      <circle cx="16" cy="16" r="8.5" stroke={strokeOrange} strokeWidth="1.2" strokeDasharray="3 2" />

      {/* Central Protected Key Core Vault */}
      <circle cx="16" cy="16" r="6" fill={fillDeep} stroke={strokeAccent} strokeWidth="1.2" />

      {/* Dual Interlocking Asymmetric Key Pair (Private & Public) */}
      {/* Symmetric Key Bow */}
      <circle cx="13.5" cy="13.5" r="2.8" fill={fillCore} stroke={strokeAccent} strokeWidth="1.1" />
      <circle cx="13.5" cy="13.5" r="1.1" fill={fillFoundation} />

      {/* Diagonal Cryptographic Key Stem */}
      <line x1="15.5" y1="15.5" x2="21.5" y2="21.5" stroke={strokeAccent} strokeWidth="1.8" strokeLinecap="round" />
      {/* Bit 1 */}
      <line x1="18.5" y1="18.5" x2="20" y2="17" stroke={strokeAccent} strokeWidth="1.4" strokeLinecap="round" />
      {/* Bit 2 */}
      <line x1="20.5" y1="20.5" x2="22.5" y2="18.5" stroke={strokeAccent} strokeWidth="1.4" strokeLinecap="round" />

      {/* External HSM Cryptographic Bus Contacts */}
      <circle cx="16" cy="4.5" r="0.8" fill={strokeAccent} />
      <circle cx="27.5" cy="16" r="0.8" fill={strokeAccent} />
      <circle cx="16" cy="27.5" r="0.8" fill={strokeAccent} />
      <circle cx="4.5" cy="16" r="0.8" fill={strokeAccent} />
    </svg>
  );
};
