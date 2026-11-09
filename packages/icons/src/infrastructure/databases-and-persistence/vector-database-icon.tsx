import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const VectorDatabaseIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Vector Database",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeLavender = isColored ? "#C4B5FD" : "#A3A3A3";
  const fillFoundation = isColored ? "#3B0764" : "#1A1A1A";
  const strokeViolet = isColored ? "#A78BFA" : "#737373";
  const strokeAxis = isColored ? "#818CF8" : "#525252";
  const fillInner = isColored ? "#4C1D95" : "#262626";
  const fillVector = isColored ? "#EDE9FE" : "#E5E5E5";

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
      {/* Top Storage Cap */}
      <ellipse
        cx="16"
        cy="6"
        rx="10"
        ry="3.2"
        fill={fillFoundation}
        stroke={strokeLavender}
        strokeWidth="1.5"
      />

      {/* Main Enclosure */}
      <path
        d="M6 6v18c0 1.77 4.48 3.2 10 3.2s10-1.43 10-3.2v-18"
        stroke={strokeLavender}
        strokeWidth="1.5"
      />

      {/* Middle Stratum */}
      <path
        d="M6 11.5c0 1.77 4.48 3.2 10 3.2s10-1.43 10-3.2"
        stroke={strokeViolet}
        strokeWidth="1.2"
      />

      {/* High-Dimensional Embedding Vector Space Chamber */}
      <rect
        x="9.5"
        y="14.5"
        width="13"
        height="10"
        rx="1.5"
        fill={fillInner}
        stroke={strokeViolet}
        strokeWidth="1.1"
      />

      {/* Multidimensional Vector Axes (X, Y, Z projection) */}
      <path
        d="M12 22v-6M12 22h7M12 22l3.5-3.5"
        stroke={strokeAxis}
        strokeWidth="1.1"
        strokeLinecap="round"
      />

      {/* Clustered Embedding Coordinate Vectors & Nearest-Neighbor Points */}
      <path
        d="M12 22l4-5M12 22l6-2"
        stroke={strokeLavender}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="16" cy="17" r="1.2" fill={fillVector} />
      <circle cx="18" cy="20" r="1" fill={fillVector} />
      <circle cx="14" cy="19.5" r="0.8" fill={fillVector} />
    </svg>
  );
};

