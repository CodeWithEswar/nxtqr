import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const ManagedDatabaseIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Managed Database",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#60A5FA" : "#A3A3A3";
  const strokeAccent = isColored ? "#BFDBFE" : "#D4D4D4";
  const fillFoundation = isColored ? "#172554" : "#141414";
  const fillSurface = isColored ? "#1E3A8A" : "#1F1F1F";

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
      {/* Primary Database Cylinder Base */}
      {/* Bottom tier */}
      <path
        d="M6 19.5C6 21.5 9.5 23 14 23C18.5 23 22 21.5 22 19.5V23C22 25 18.5 26.5 14 26.5C9.5 26.5 6 25 6 23V19.5Z"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.2"
      />
      {/* Middle tier */}
      <path
        d="M6 13C6 15 9.5 16.5 14 16.5C18.5 16.5 22 15 22 13V16.5C22 18.5 18.5 20 14 20C9.5 20 6 18.5 6 16.5V13Z"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.2"
      />
      {/* Top cap */}
      <ellipse
        cx="14"
        cy="9.5"
        rx="8"
        ry="3.5"
        fill={fillSurface}
        stroke={strokeColor}
        strokeWidth="1.3"
      />

      {/* Database Disk Platter Track */}
      <ellipse cx="14" cy="9.5" rx="4.5" ry="1.8" stroke={strokeAccent} strokeWidth="1" strokeDasharray="2 1.5" />

      {/* Managed Service Shield / Maintenance Cog (Right Side Overlay) */}
      <circle cx="23.5" cy="11.5" r="5" fill={fillSurface} stroke={strokeAccent} strokeWidth="1.2" />
      {/* Managed Automation Sparkle / Star Inside Shield */}
      <path
        d="M23.5 8.5L24.5 10.5L26.5 11.5L24.5 12.5L23.5 14.5L22.5 12.5L20.5 11.5L22.5 10.5Z"
        fill={strokeAccent}
      />
    </svg>
  );
};

