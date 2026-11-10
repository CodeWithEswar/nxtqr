import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const CloudLoadBalancerIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Cloud Load Balancer",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#38BDF8" : "#A3A3A3";
  const strokeAccent = isColored ? "#BAE6FD" : "#D4D4D4";
  const fillFoundation = isColored ? "#082F49" : "#141414";
  const fillSurface = isColored ? "#0C4A6E" : "#1F1F1F";

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
      {/* Central Traffic Distribution Switcher Hub */}
      <circle
        cx="16"
        cy="15"
        r="5.5"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.3"
      />

      {/* Internal Routing Core Matrix */}
      <circle cx="16" cy="15" r="2" fill={strokeAccent} />

      {/* Ingress Client Traffic Path (Top Arrow into Hub) */}
      <line x1="16" y1="3.5" x2="16" y2="9.5" stroke={strokeAccent} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M14 7.5L16 9.5L18 7.5" stroke={strokeAccent} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Backend Distribution Paths (3 Downstream Targets) */}
      {/* Left Backend Path */}
      <path
        d="M12 18.5L8 23V26"
        stroke={strokeColor}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="8" cy="27" r="1.5" fill={fillSurface} stroke={strokeAccent} strokeWidth="1" />

      {/* Center Backend Path */}
      <path
        d="M16 20.5V26"
        stroke={strokeColor}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="16" cy="27" r="1.5" fill={fillSurface} stroke={strokeAccent} strokeWidth="1" />

      {/* Right Backend Path */}
      <path
        d="M20 18.5L24 23V26"
        stroke={strokeColor}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="24" cy="27" r="1.5" fill={fillSurface} stroke={strokeAccent} strokeWidth="1" />
    </svg>
  );
};
