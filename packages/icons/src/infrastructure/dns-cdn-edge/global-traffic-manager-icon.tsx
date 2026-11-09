import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const GlobalTrafficManagerIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Global Traffic Manager",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeGlobe = isColored ? "#818CF8" : "#A3A3A3";
  const fillGlobe = isColored ? "#312E81" : "#1A1A1A";
  const strokeGrid = isColored ? "#4F46E5" : "#404040";
  const fillController = isColored ? "#6366F1" : "#262626";
  const fillArrow = isColored ? "#38BDF8" : "#E5E5E5";
  const strokeArrow = isColored ? "#818CF8" : "#737373";

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
      {/* Global Coordinate Disk */}
      <circle
        cx="16"
        cy="16"
        r="11"
        fill={fillGlobe}
        stroke={strokeGlobe}
        strokeWidth="1.5"
      />

      {/* Latitudinal & Longitudinal Grid Curves */}
      <ellipse cx="16" cy="16" rx="5" ry="11" stroke={strokeGrid} strokeWidth="1" />
      <line x1="5" y1="16" x2="27" y2="16" stroke={strokeGrid} strokeWidth="1" />

      {/* Central Traffic Control Hub */}
      <circle cx="16" cy="16" r="3.5" fill={fillController} stroke={strokeGlobe} strokeWidth="1" />
      <circle cx="16" cy="16" r="1.2" fill="#FFFFFF" />

      {/* Dynamic Multi-Region Steering Vectors */}
      {/* North-West Region Vector */}
      <path d="M13.5 13.5L9 9" stroke={strokeArrow} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M12 8L8 8L8 12" fill="none" stroke={fillArrow} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />

      {/* North-East Region Vector */}
      <path d="M18.5 13.5L23 9" stroke={strokeArrow} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M20 8L24 8L24 12" fill="none" stroke={fillArrow} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />

      {/* South-East Region Vector */}
      <path d="M18.5 18.5L23 23" stroke={strokeArrow} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M24 20L24 24L20 24" fill="none" stroke={fillArrow} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

