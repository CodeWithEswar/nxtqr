import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const NatGatewayIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "NAT Gateway",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeNat = isColored ? "#FBBF24" : "#A3A3A3";
  const fillNat = isColored ? "#78350F" : "#1A1A1A";
  const strokePrivate = isColored ? "#60A5FA" : "#737373";
  const strokeBoundary = isColored ? "#CBD5E1" : "#525252";
  const fillAccent = isColored ? "#FDE68A" : "#D4D4D4";

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
      {/* Network Boundary Divider (Vertical Dashed Line) */}
      <path d="M16 4v24" stroke={strokeBoundary} strokeWidth="1" strokeDasharray="2 2" strokeOpacity="0.6" />

      {/* NAT Translation Core Box */}
      <rect
        x="10"
        y="10"
        width="12"
        height="12"
        rx="2.5"
        fill={fillNat}
        stroke={strokeNat}
        strokeWidth="1.5"
      />
      {/* Internal Translation Symbol (Conversion Arrows) */}
      <path d="M13.5 14h5M17 12.5l1.5 1.5-1.5 1.5" stroke={fillAccent} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.5 18h-5M15 16.5l-1.5 1.5 1.5 1.5" stroke={fillAccent} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Private Ingress (Left: 2 Private IP Streams) */}
      <path d="M4 12h6M4 20h6" stroke={strokePrivate} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="4" cy="12" r="1.5" fill={strokePrivate} />
      <circle cx="4" cy="20" r="1.5" fill={strokePrivate} />

      {/* Public Single Egress (Right: Translated Outbound IP) */}
      <path d="M22 16h6M26 14l2 2-2 2" stroke={strokeNat} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="28.5" cy="16" r="1.5" fill={strokeNat} />
    </svg>
  );
};

