import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const ApplicationCacheIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Application Cache",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeCyan = isColored ? "#38BDF8" : "#A3A3A3";
  const fillFoundation = isColored ? "#082F49" : "#1A1A1A";
  const strokeAccent = isColored ? "#BAE6FD" : "#E5E5E5";
  const strokeSubtle = isColored ? "#0284C7" : "#737373";
  const fillCache = isColored ? "#0C4A6E" : "#262626";

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
      {/* Outer Application Process Chassis */}
      <rect
        x="4.5"
        y="5"
        width="23"
        height="22"
        rx="2"
        fill={fillFoundation}
        stroke={strokeCyan}
        strokeWidth="1.5"
      />

      {/* App Header Bar */}
      <line
        x1="4.5"
        y1="10.5"
        x2="27.5"
        y2="10.5"
        stroke={strokeSubtle}
        strokeWidth="1.2"
      />

      {/* Application Process Dots */}
      <circle cx="7.5" cy="7.75" r="0.9" fill={strokeAccent} />
      <circle cx="10.5" cy="7.75" r="0.9" fill={strokeSubtle} />

      {/* Embedded In-Memory Cache Bank (L1/Heap Cache) */}
      <rect
        x="8.5"
        y="14"
        width="15"
        height="10"
        rx="1.5"
        fill={fillCache}
        stroke={strokeCyan}
        strokeWidth="1.3"
      />

      {/* In-Process Lightning / Zero-Serialization Memory Bolt */}
      <path
        d="M16.5 15.5l-2.5 3.5h2.5l-1 3.5 3-4h-2.5l1-3z"
        fill={strokeAccent}
      />

      {/* Direct Memory Pointer Feeds */}
      <path
        d="M6.5 19h2M23.5 19h2"
        stroke={strokeCyan}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
};

