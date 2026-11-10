import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const SystemBoundaryIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "System Boundary",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeBoundary = isColored ? "#38BDF8" : "#A3A3A3";
  const strokeAccent = isColored ? "#BAE6FD" : "#E5E5E5";
  const fillFoundation = isColored ? "#082F49" : "#141414";
  const fillSurface = isColored ? "#0C4A6E" : "#1F1F1F";
  const innerNodeFill = isColored ? "#0369A1" : "#262626";

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
      {/* Outer Enclosing Boundary with Header Notch */}
      <path
        d="M3 8C3 5.79086 4.79086 4 7 4H15L17 7H25C27.2091 7 29 8.79086 29 11V25C29 27.2091 27.2091 29 25 29H7C4.79086 29 3 27.2091 3 25V8Z"
        fill={fillFoundation}
        stroke={strokeBoundary}
        strokeWidth="1.2"
        strokeDasharray="4 2"
      />

      {/* Internal Subsystem Node 1 */}
      <rect
        x="6"
        y="12"
        width="8"
        height="6"
        rx="1.5"
        fill={fillSurface}
        stroke={strokeAccent}
        strokeWidth="1"
      />
      <circle cx="10" cy="15" r="1.2" fill={strokeAccent} />

      {/* Internal Subsystem Node 2 */}
      <rect
        x="18"
        y="12"
        width="8"
        height="6"
        rx="1.5"
        fill={fillSurface}
        stroke={strokeAccent}
        strokeWidth="1"
      />
      <circle cx="22" cy="15" r="1.2" fill={strokeAccent} />

      {/* Inter-subsystem linkage */}
      <path
        d="M14 15H18"
        stroke={strokeBoundary}
        strokeWidth="1"
        strokeDasharray="1.5 1.5"
      />

      {/* Bottom Internal Storage/Platform Tier */}
      <rect
        x="9"
        y="21"
        width="14"
        height="5"
        rx="1.5"
        fill={innerNodeFill}
        stroke={strokeAccent}
        strokeWidth="0.8"
      />
      <circle cx="13" cy="23.5" r="0.8" fill={strokeAccent} />
      <circle cx="16" cy="23.5" r="0.8" fill={strokeAccent} />
      <circle cx="19" cy="23.5" r="0.8" fill={strokeAccent} />
    </svg>
  );
};
