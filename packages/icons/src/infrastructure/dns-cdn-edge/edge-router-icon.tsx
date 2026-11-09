import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const EdgeRouterIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Edge Router",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeHub = isColored ? "#60A5FA" : "#A3A3A3";
  const fillHub = isColored ? "#172554" : "#1A1A1A";
  const strokePath = isColored ? "#2563EB" : "#525252";
  const fillArrow = isColored ? "#38BDF8" : "#E5E5E5";
  const fillPort = isColored ? "#1D4ED8" : "#333333";
  const strokePort = isColored ? "#93C5FD" : "#737373";

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
      {/* Central Cylindrical Routing Chassis */}
      <circle
        cx="16"
        cy="16"
        r="10"
        fill={fillHub}
        stroke={strokeHub}
        strokeWidth="1.5"
      />

      {/* Internal Routing Cross Fabric */}
      <circle cx="16" cy="16" r="3.5" fill={fillPort} stroke={strokePort} strokeWidth="1" />

      {/* Top Routing Vector (Ingress/Egress) */}
      <path d="M16 12.5V6" stroke={strokePath} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M14 8l2-3 2 3" fill="none" stroke={fillArrow} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Bottom Routing Vector */}
      <path d="M16 19.5V26" stroke={strokePath} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M14 24l2 3 2-3" fill="none" stroke={fillArrow} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Left Routing Vector */}
      <path d="M12.5 16H6" stroke={strokePath} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M8 14l-3 2 3 2" fill="none" stroke={fillArrow} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Right Routing Vector */}
      <path d="M19.5 16H26" stroke={strokePath} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M24 14l3 2-3 2" fill="none" stroke={fillArrow} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};
