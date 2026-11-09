import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const DnsResolverIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "DNS Resolver",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeHub = isColored ? "#60A5FA" : "#A3A3A3";
  const fillHub = isColored ? "#1E3A8A" : "#1A1A1A";
  const strokeBranch = isColored ? "#38BDF8" : "#737373";
  const fillNode = isColored ? "#2563EB" : "#333333";
  const fillAccent = isColored ? "#93C5FD" : "#D4D4D4";
  const strokePath = isColored ? "#60A5FA" : "#525252";

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
      {/* Central Resolver Core */}
      <rect
        x="11"
        y="11"
        width="10"
        height="10"
        rx="2.5"
        fill={fillHub}
        stroke={strokeHub}
        strokeWidth="1.5"
      />
      {/* Inner Resolver Pulse */}
      <circle cx="16" cy="16" r="2" fill={fillAccent} />

      {/* Query Ingress Line (Top) */}
      <path d="M16 3v5" stroke={strokePath} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="16" cy="3.5" r="1.5" fill={fillNode} stroke={strokeBranch} strokeWidth="1" />

      {/* Recursive Query Branch Left */}
      <path d="M11 16H6v7" stroke={strokePath} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="3.5" y="23" width="5" height="5" rx="1" fill={fillNode} stroke={strokeBranch} strokeWidth="1" />

      {/* Recursive Query Branch Right */}
      <path d="M21 16h5v7" stroke={strokePath} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="23.5" y="23" width="5" height="5" rx="1" fill={fillNode} stroke={strokeBranch} strokeWidth="1" />

      {/* Response Cache Egress (Bottom Center) */}
      <path d="M16 21v6" stroke={strokeBranch} strokeWidth="1.5" strokeLinecap="round" strokeDasharray="1.5 1.5" />
      <circle cx="16" cy="28" r="1.5" fill={fillAccent} />
    </svg>
  );
};
