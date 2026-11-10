import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const BuildServerIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Build Server",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#FBBF24" : "#A3A3A3";
  const strokeAccent = isColored ? "#FDE68A" : "#D4D4D4";
  const fillFoundation = isColored ? "#451A03" : "#141414";
  const fillSurface = isColored ? "#78350F" : "#1F1F1F";

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
      {/* Heavy Build Worker Chassis */}
      <rect
        x="5"
        y="6"
        width="22"
        height="20"
        rx="3"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.3"
      />

      {/* Internal Worker Compilation Core / Cogwheel Geometry */}
      <circle
        cx="16"
        cy="15"
        r="4.5"
        fill={fillSurface}
        stroke={strokeAccent}
        strokeWidth="1.2"
      />
      <circle cx="16" cy="15" r="1.5" fill={strokeColor} />

      {/* Industrial Build Engine Teeth */}
      <line x1="16" y1="9" x2="16" y2="10.5" stroke={strokeAccent} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="16" y1="19.5" x2="16" y2="21" stroke={strokeAccent} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10" y1="15" x2="11.5" y2="15" stroke={strokeAccent} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="20.5" y1="15" x2="22" y2="15" stroke={strokeAccent} strokeWidth="1.5" strokeLinecap="round" />

      {/* Worker Bay Activity Indicators (LED status) */}
      <circle cx="9" cy="22.5" r="1.2" fill={isColored ? "#34D399" : "#D4D4D4"} />
      <circle cx="13" cy="22.5" r="1.2" fill={isColored ? "#FBBF24" : "#A3A3A3"} />
      <line x1="17" y1="22.5" x2="23" y2="22.5" stroke={strokeColor} strokeWidth="1" strokeLinecap="round" />

      {/* Build Input / Output Terminal Ports */}
      <path d="M16 2V6" stroke={strokeColor} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M16 26V30" stroke={strokeAccent} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
};

