import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const PostgresqlIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "PostgreSQL",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeBlue = isColored ? "#60A5FA" : "#A3A3A3";
  const fillCylinder = isColored ? "#1E3A8A" : "#1A1A1A";
  const strokeCyan = isColored ? "#38BDF8" : "#737373";
  const strokeAccent = isColored ? "#93C5FD" : "#D4D4D4";
  const fillInner = isColored ? "#172554" : "#262626";
  const fillDot = isColored ? "#DBEAFE" : "#E5E5E5";

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
      {/* Top Elliptical Storage Cap */}
      <ellipse
        cx="16"
        cy="7"
        rx="10.5"
        ry="3.5"
        fill={fillCylinder}
        stroke={strokeBlue}
        strokeWidth="1.5"
      />

      {/* Main Database Enclosure */}
      <path
        d="M5.5 7v16c0 1.93 4.7 3.5 10.5 3.5s10.5-1.57 10.5-3.5v-16"
        stroke={strokeBlue}
        strokeWidth="1.5"
      />

      {/* Write-Ahead Log (WAL) / Middle Storage Stratum Ring */}
      <path
        d="M5.5 13c0 1.93 4.7 3.5 10.5 3.5s10.5-1.57 10.5-3.5"
        stroke={strokeCyan}
        strokeWidth="1.2"
      />

      {/* Relational Table & Schema Projection Window */}
      <rect
        x="9.5"
        y="15.5"
        width="13"
        height="9"
        rx="1.5"
        fill={fillInner}
        stroke={strokeAccent}
        strokeWidth="1.2"
      />

      {/* Multi-Column Relational Grid (Primary Key & Foreign Keys) */}
      <path
        d="M9.5 18.5h13M14 18.5v6M18.5 18.5v6"
        stroke={strokeBlue}
        strokeWidth="1"
      />
      <circle cx="11.5" cy="17" r="0.75" fill={fillDot} />
      <circle cx="16" cy="17" r="0.75" fill={fillDot} />
      <circle cx="20.5" cy="17" r="0.75" fill={fillDot} />
    </svg>
  );
};

