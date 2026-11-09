import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const MysqlIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "MySQL",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeCyan = isColored ? "#38BDF8" : "#A3A3A3";
  const fillCylinder = isColored ? "#0C4A6E" : "#1A1A1A";
  const strokeBlue = isColored ? "#0284C7" : "#737373";
  const strokeAccent = isColored ? "#7DD3FC" : "#D4D4D4";
  const fillInner = isColored ? "#082F49" : "#262626";
  const fillDot = isColored ? "#E0F2FE" : "#E5E5E5";

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
        cy="7"
        rx="10"
        ry="3.2"
        fill={fillCylinder}
        stroke={strokeCyan}
        strokeWidth="1.5"
      />

      {/* Database Chassis Profile */}
      <path
        d="M6 7v16c0 1.77 4.48 3.2 10 3.2s10-1.43 10-3.2v-16"
        stroke={strokeCyan}
        strokeWidth="1.5"
      />

      {/* Middle Disk Partition Stratum */}
      <path
        d="M6 12.5c0 1.77 4.48 3.2 10 3.2s10-1.43 10-3.2"
        stroke={strokeBlue}
        strokeWidth="1.2"
      />

      {/* Structured Query Execution & InnoDB Table Engine Block */}
      <rect
        x="10"
        y="15.5"
        width="12"
        height="9"
        rx="1.5"
        fill={fillInner}
        stroke={strokeAccent}
        strokeWidth="1.2"
      />
      {/* Table rows & binary log indicator */}
      <path
        d="M10 18.5h12M10 21.5h12M15 18.5v6"
        stroke={strokeCyan}
        strokeWidth="1"
      />
      <circle cx="12.5" cy="17" r="0.75" fill={fillDot} />
      <circle cx="17.5" cy="17" r="0.75" fill={fillDot} />
    </svg>
  );
};

