import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const ContainerIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Container",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeCyan = isColored ? "#38BDF8" : "#A3A3A3";
  const fillContainer = isColored ? "#082F49" : "#1A1A1A";
  const strokeRibs = isColored ? "#7DD3FC" : "#737373";
  const fillLugs = isColored ? "#BAE6FD" : "#D4D4D4";
  const strokeBorder = isColored ? "#0284C7" : "#525252";

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
      {/* Rectangular Container Enclosure (Shipping Cargo Silhouette) */}
      <rect
        x="4.5"
        y="7.5"
        width="23"
        height="17"
        rx="2"
        fill={fillContainer}
        stroke={strokeCyan}
        strokeWidth="1.5"
      />

      {/* Vertical Structural Corrugation Grooves / Runtime Compartments */}
      <path
        d="M9.5 10v12M13.5 10v12M18.5 10v12M22.5 10v12"
        stroke={strokeRibs}
        strokeWidth="1.4"
        strokeLinecap="round"
      />

      {/* Corner Lifting Lugs & Isolation Fasteners */}
      <rect x="5.5" y="8.5" width="2" height="2" rx="0.5" fill={fillLugs} />
      <rect x="24.5" y="8.5" width="2" height="2" rx="0.5" fill={fillLugs} />
      <rect x="5.5" y="21.5" width="2" height="2" rx="0.5" fill={fillLugs} />
      <rect x="24.5" y="21.5" width="2" height="2" rx="0.5" fill={fillLugs} />

      {/* Top Container Stacking Rails */}
      <path d="M7 5.5h18" stroke={strokeBorder} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
};
