import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const WebApplicationFirewallIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Web Application Firewall",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeRed = isColored ? "#F87171" : "#A3A3A3";
  const fillDeep = isColored ? "#7F1D1D" : "#262626";
  const fillFoundation = isColored ? "#450A0A" : "#141414";
  const strokeAccent = isColored ? "#FECACA" : "#E5E5E5";
  const fillPlate = isColored ? "#991B1B" : "#1F1F1F";

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
      {/* Perimeter WAF Armor Shield */}
      <path
        d="M16 3L27.5 7V15C27.5 22.5 22 27.5 16 29.5C10 27.5 4.5 22.5 4.5 15V7L16 3Z"
        fill={fillFoundation}
        stroke={strokeRed}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Internal HTTP Deep Inspection Chamber */}
      <path
        d="M16 6L24.5 9V15C24.5 20.8 20.5 24.8 16 26.5C11.5 24.8 7.5 20.8 7.5 15V9L16 6Z"
        fill={fillDeep}
        stroke={strokeRed}
        strokeWidth="1.1"
      />

      {/* Application Firewall Inspection Louvers / Brick Pattern */}
      {/* Row 1 */}
      <rect x="9.5" y="10.5" width="6" height="3" rx="0.75" fill={fillPlate} stroke={strokeAccent} strokeWidth="0.8" />
      <rect x="16.5" y="10.5" width="6" height="3" rx="0.75" fill={fillPlate} stroke={strokeAccent} strokeWidth="0.8" />

      {/* Row 2 (Staggered Brick Firewall) */}
      <rect x="8.5" y="14.5" width="4.5" height="3" rx="0.75" fill={fillPlate} stroke={strokeAccent} strokeWidth="0.8" />
      <rect x="14" y="14.5" width="4" height="3" rx="0.75" fill={fillPlate} stroke={strokeAccent} strokeWidth="0.8" />
      <rect x="19" y="14.5" width="4.5" height="3" rx="0.75" fill={fillPlate} stroke={strokeAccent} strokeWidth="0.8" />

      {/* Row 3 */}
      <rect x="10.5" y="18.5" width="5" height="3" rx="0.75" fill={fillPlate} stroke={strokeAccent} strokeWidth="0.8" />
      <rect x="16.5" y="18.5" width="5" height="3" rx="0.75" fill={fillPlate} stroke={strokeAccent} strokeWidth="0.8" />

      {/* OWASP Inspection Filter Flame / Shield Core Motif */}
      <path
        d="M16 22.5V25"
        stroke={strokeAccent}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
};
