import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const NetworkFirewallIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Network Firewall",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeShield = isColored ? "#F87171" : "#A3A3A3";
  const fillShield = isColored ? "#7F1D1D" : "#1A1A1A";
  const strokeFilter = isColored ? "#FCA5A5" : "#737373";
  const strokePacket = isColored ? "#60A5FA" : "#525252";
  const fillAccent = isColored ? "#FECACA" : "#D4D4D4";

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
      {/* Outer Firewall Shield Silhouette */}
      <path
        d="M16 3l10 4v8c0 7-5 11.5-10 14-5-2.5-10-7-10-14V7l10-4z"
        fill={fillShield}
        stroke={strokeShield}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Internal Firewall Brick/Inspection Grid */}
      <path
        d="M11 11h10M9 15h14M11 19h10M16 7v4M13 11v4M19 11v4M15 15v4M16 19v4"
        stroke={strokeFilter}
        strokeWidth="1"
        strokeLinecap="round"
      />
      <circle cx="16" cy="15" r="1.5" fill={fillAccent} />

      {/* Inbound Packet Stream (Left to Right through Firewall) */}
      <circle cx="4" cy="15" r="1.5" fill={strokePacket} />
      <circle cx="28" cy="15" r="1.5" fill={strokePacket} />
    </svg>
  );
};

