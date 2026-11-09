import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const LoadBalancerIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Load Balancer",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeHub = isColored ? "#818CF8" : "#A3A3A3";
  const fillHub = isColored ? "#312E81" : "#1A1A1A";
  const strokePath = isColored ? "#60A5FA" : "#737373";
  const fillNode = isColored ? "#1E40AF" : "#262626";
  const fillAccent = isColored ? "#C7D2FE" : "#D4D4D4";
  const strokeNode = isColored ? "#38BDF8" : "#525252";

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
      {/* Central Balancer Core */}
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
      <circle cx="16" cy="16" r="2" fill={fillAccent} />

      {/* Top Ingress Path */}
      <path d="M16 3v5.5" stroke={strokePath} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="16" cy="3.5" r="1.5" fill={fillNode} stroke={strokeNode} strokeWidth="1" />

      {/* Egress Distribution Paths (Left, Center, Right) */}
      <path
        d="M16 23.5v5.5M13.5 21l-5.5 5.5M18.5 21l5.5 5.5"
        stroke={strokePath}
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Target Destination Nodes */}
      <circle cx="7" cy="27" r="2" fill={fillNode} stroke={strokeNode} strokeWidth="1" />
      <circle cx="16" cy="29" r="2" fill={fillNode} stroke={strokeNode} strokeWidth="1" />
      <circle cx="25" cy="27" r="2" fill={fillNode} stroke={strokeNode} strokeWidth="1" />
    </svg>
  );
};

