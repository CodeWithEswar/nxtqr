import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const FailureZoneIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Failure Zone",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokePrimary = isColored ? "#FB7185" : "#A3A3A3";
  const strokeAccent = isColored ? "#FECDD3" : "#E5E5E5";
  const fillFoundation = isColored ? "#4C0519" : "#141414";
  const fillNode = isColored ? "#881337" : "#1F1F1F";

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
      {/* Octagonal Failure Domain Perimeter */}
      <path
        d="M10 4H22L28 10V22L22 28H10L4 22V10L10 4Z"
        fill={fillFoundation}
        stroke={strokePrimary}
        strokeWidth="1.2"
        strokeDasharray="4 2"
      />

      {/* Internal Shared Failure Dependency Cluster */}
      {/* Dependent Node 1 */}
      <circle cx="11" cy="12" r="2.5" fill={fillNode} stroke={strokePrimary} strokeWidth="1" />
      <circle cx="11" cy="12" r="1" fill={strokeAccent} />

      {/* Dependent Node 2 */}
      <circle cx="21" cy="12" r="2.5" fill={fillNode} stroke={strokePrimary} strokeWidth="1" />
      <circle cx="21" cy="12" r="1" fill={strokeAccent} />

      {/* Shared Single Point of Failure (SPOF) Core at Center-Bottom */}
      <rect
        x="12"
        y="19"
        width="8"
        height="6"
        rx="1.5"
        fill={fillNode}
        stroke={strokeAccent}
        strokeWidth="1"
      />

      {/* Blast Radius Correlation Conduits */}
      <path
        d="M12.5 14L14.5 19"
        stroke={strokePrimary}
        strokeWidth="1"
      />
      <path
        d="M19.5 14L17.5 19"
        stroke={strokePrimary}
        strokeWidth="1"
      />

      {/* Central Fault Propagation Flash Symbol */}
      <path
        d="M16 16.5L15 19H17L16 21.5"
        stroke={strokeAccent}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
