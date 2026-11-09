import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const DocumentDatabaseIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Document Database",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeGreen = isColored ? "#34D399" : "#A3A3A3";
  const fillCylinder = isColored ? "#064E3B" : "#1A1A1A";
  const strokeDoc = isColored ? "#6EE7B7" : "#D4D4D4";
  const fillDoc = isColored ? "#022C22" : "#262626";
  const strokeField = isColored ? "#10B981" : "#737373";
  const fillCorner = isColored ? "#A7F3D0" : "#D4D4D4";

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
      {/* Top Database Disk Ellipse */}
      <ellipse
        cx="16"
        cy="7"
        rx="10.5"
        ry="3.5"
        fill={fillCylinder}
        stroke={strokeGreen}
        strokeWidth="1.5"
      />

      {/* Main Database Enclosure Walls */}
      <path
        d="M5.5 7v16c0 1.93 4.7 3.5 10.5 3.5s10.5-1.57 10.5-3.5v-16"
        stroke={strokeGreen}
        strokeWidth="1.5"
      />

      {/* Internal Collection Tier Ring */}
      <path
        d="M5.5 13c0 1.93 4.7 3.5 10.5 3.5s10.5-1.57 10.5-3.5"
        stroke={strokeField}
        strokeWidth="1.2"
      />

      {/* Compact JSON / BSON Document Silhouette with Folded Corner */}
      <path
        d="M11 15h7l4 4v6a1 1 0 01-1 1h-10a1 1 0 01-1-1v-9a1 1 0 011-1z"
        fill={fillDoc}
        stroke={strokeDoc}
        strokeWidth="1.2"
      />
      {/* Folded Document Ear */}
      <path d="M18 15v4h4" stroke={strokeDoc} strokeWidth="1" fill={fillCorner} />

      {/* JSON Schema Key-Value Document Lines */}
      <path
        d="M13 20h3M13 23h6"
        stroke={strokeDoc}
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
};

