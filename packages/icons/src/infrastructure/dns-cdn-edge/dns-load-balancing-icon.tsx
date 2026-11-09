import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const DnsLoadBalancingIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "DNS Load Balancing",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeHub = isColored ? "#818CF8" : "#A3A3A3";
  const fillHub = isColored ? "#312E81" : "#1A1A1A";
  const strokePath = isColored ? "#6366F1" : "#525252";
  const fillEndpoint = isColored ? "#4F46E5" : "#262626";
  const strokeEndpoint = isColored ? "#A5B4FC" : "#737373";
  const fillAccent = isColored ? "#C7D2FE" : "#D4D4D4";

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
      {/* Top Query Ingress Point */}
      <circle cx="16" cy="4" r="2" fill={fillAccent} />
      <line x1="16" y1="6" x2="16" y2="9" stroke={strokePath} strokeWidth="1.5" strokeLinecap="round" />

      {/* Primary DNS Decision Dispatcher */}
      <rect
        x="10"
        y="9"
        width="12"
        height="7"
        rx="2"
        fill={fillHub}
        stroke={strokeHub}
        strokeWidth="1.5"
      />
      {/* Ratio / Balance Slots */}
      <circle cx="13.5" cy="12.5" r="1" fill={fillAccent} />
      <circle cx="16" cy="12.5" r="1" fill={strokeEndpoint} />
      <circle cx="18.5" cy="12.5" r="1" fill={fillAccent} />

      {/* Balanced Distribution Branches */}
      {/* Left Branch */}
      <path d="M12 16v4c0 1.5-1.5 2.5-3 2.5H7.5v2.5" stroke={strokePath} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      {/* Center Branch */}
      <line x1="16" y1="16" x2="16" y2="25" stroke={strokePath} strokeWidth="1.3" strokeLinecap="round" />
      {/* Right Branch */}
      <path d="M20 16v4c0 1.5 1.5 2.5 3 2.5h1.5v2.5" stroke={strokePath} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />

      {/* Endpoint Targets */}
      {/* Left Endpoint Target */}
      <rect x="5" y="25" width="5" height="4" rx="1" fill={fillEndpoint} stroke={strokeEndpoint} strokeWidth="1" />
      {/* Center Endpoint Target */}
      <rect x="13.5" y="25" width="5" height="4" rx="1" fill={fillEndpoint} stroke={strokeEndpoint} strokeWidth="1" />
      {/* Right Endpoint Target */}
      <rect x="22" y="25" width="5" height="4" rx="1" fill={fillEndpoint} stroke={strokeEndpoint} strokeWidth="1" />
    </svg>
  );
};
