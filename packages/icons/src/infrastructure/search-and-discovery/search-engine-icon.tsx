import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const SearchEngineIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Search Engine",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeCyan = isColored ? "#38BDF8" : "#A3A3A3";
  const strokeAccent = isColored ? "#7DD3FC" : "#E5E5E5";
  const fillFoundation = isColored ? "#082F49" : "#141414";
  const fillResult = isColored ? "#0369A1" : "#262626";

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
      {/* Background Result Stack */}
      <rect
        x="6"
        y="5"
        width="16"
        height="18"
        rx="2"
        fill={fillFoundation}
        stroke={strokeCyan}
        strokeWidth="1.2"
      />
      {/* Document Text Lines */}
      <line x1="9" y1="9" x2="16" y2="9" stroke={strokeAccent} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="9" y1="12" x2="18" y2="12" stroke={strokeAccent} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="9" y1="15" x2="14" y2="15" stroke={strokeAccent} strokeWidth="1.2" strokeLinecap="round" />

      {/* Foreground Search Optical Lens */}
      <circle
        cx="19"
        cy="18"
        r="7.5"
        fill={fillResult}
        stroke={strokeCyan}
        strokeWidth="1.6"
      />
      {/* Optical Reticle / Crosshair */}
      <circle
        cx="19"
        cy="18"
        r="4.5"
        stroke={strokeAccent}
        strokeWidth="1"
        strokeDasharray="2 1.5"
      />
      <circle cx="19" cy="18" r="1.5" fill={strokeAccent} />

      {/* Lens Handle */}
      <line
        x1="24.5"
        y1="23.5"
        x2="29"
        y2="28"
        stroke={strokeCyan}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
};
