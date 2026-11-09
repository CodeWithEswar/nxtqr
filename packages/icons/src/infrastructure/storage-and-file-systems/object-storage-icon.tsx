import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const ObjectStorageIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Object Storage",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeCyan = isColored ? "#38BDF8" : "#A3A3A3";
  const fillDeep = isColored ? "#0369A1" : "#262626";
  const fillFoundation = isColored ? "#082F49" : "#141414";
  const strokeAccent = isColored ? "#BAE6FD" : "#E5E5E5";
  const fillObject = isColored ? "#0284C7" : "#1F1F1F";

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
      {/* Bucket / Storage Container Body */}
      <path
        d="M6 11L8.5 25.5C8.7 26.9 9.9 28 11.3 28H20.7C22.1 28 23.3 26.9 23.5 25.5L26 11"
        stroke={strokeCyan}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Container Interior Fill */}
      <path
        d="M6.8 12.5L9 25.2C9.1 26.2 10 27 11.1 27H20.9C22 27 22.9 26.2 23 25.2L25.2 12.5"
        fill={fillFoundation}
      />

      {/* Top Rim of Bucket / Container */}
      <ellipse
        cx="16"
        cy="10.5"
        rx="10"
        ry="3.5"
        fill={fillDeep}
        stroke={strokeCyan}
        strokeWidth="1.5"
      />

      {/* Discrete Immutable Storage Objects (Hexagonal / Cuboid Shapes) */}
      {/* Object 1 - Base resting */}
      <path
        d="M12 17L16 14.5L20 17L16 19.5L12 17Z"
        fill={fillObject}
        stroke={strokeAccent}
        strokeWidth="1.1"
      />
      <path
        d="M12 17V20.5L16 23V19.5"
        stroke={strokeAccent}
        strokeWidth="1.1"
      />
      <path
        d="M20 17V20.5L16 23"
        stroke={strokeAccent}
        strokeWidth="1.1"
      />

      {/* Object 2 - Ingress Floating Object */}
      <path
        d="M14 4L16 2.8L18 4L16 5.2L14 4Z"
        fill={fillDeep}
        stroke={strokeCyan}
        strokeWidth="1"
      />
      <path
        d="M14 4V6.2L16 7.4V5.2"
        stroke={strokeCyan}
        strokeWidth="1"
      />
      <path
        d="M18 4V6.2L16 7.4"
        stroke={strokeCyan}
        strokeWidth="1"
      />

      {/* Downward Ingestion Guide */}
      <path
        d="M16 8V9.5"
        stroke={strokeAccent}
        strokeWidth="1.2"
        strokeDasharray="1 1"
      />
    </svg>
  );
};
