import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const WriteBehindCacheIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Write-Behind Cache",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeLavender = isColored ? "#C4B5FD" : "#A3A3A3";
  const fillFoundation = isColored ? "#4C1D95" : "#1A1A1A";
  const strokeAccent = isColored ? "#EDE9FE" : "#E5E5E5";
  const strokeSubtle = isColored ? "#8B5CF6" : "#737373";
  const fillStore = isColored ? "#2E1065" : "#262626";

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
      {/* Fast In-Memory Write Buffer (Top) */}
      <rect
        x="6"
        y="5"
        width="20"
        height="8.5"
        rx="1.5"
        fill={fillFoundation}
        stroke={strokeLavender}
        strokeWidth="1.4"
      />
      <line x1="8.5" y1="9.25" x2="14" y2="9.25" stroke={strokeAccent} strokeWidth="1.1" strokeLinecap="round" />

      {/* Immediate Write Acknowledgment Check */}
      <circle cx="22" cy="9.25" r="2.2" fill={strokeSubtle} />
      <path d="M21 9.25l0.75 0.75 1.5-1.5" stroke={strokeAccent} strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />

      {/* Deferred Asynchronous Queue Buffer (Conveyor Dots) */}
      <circle cx="10" cy="16.5" r="1.3" fill={strokeLavender} />
      <circle cx="14" cy="16.5" r="1.3" fill={strokeLavender} />
      <circle cx="18" cy="16.5" r="1.3" fill={strokeLavender} />

      {/* Deferred Async Write Arrow */}
      <path
        d="M14 13.5v5.5"
        stroke={strokeSubtle}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeDasharray="2 1.5"
      />
      <path d="M12 17.5l2 2 2-2" stroke={strokeSubtle} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Async Timer / Clock Motif (Indicating Delayed Batch Persistence) */}
      <circle cx="23" cy="16.5" r="3.25" fill={fillFoundation} stroke={strokeLavender} strokeWidth="1.1" />
      <path d="M23 14.75v1.75l1.25 1" stroke={strokeAccent} strokeWidth="0.9" strokeLinecap="round" />

      {/* Backing Persistent Data Store (Bottom Database Cylinder) */}
      <ellipse cx="16" cy="23.5" rx="9" ry="2.75" fill={fillStore} stroke={strokeLavender} strokeWidth="1.3" />
      <path
        d="M7 23.5v2.5c0 1.52 4.03 2.75 9 2.75s9-1.23 9-2.75v-2.5"
        stroke={strokeLavender}
        strokeWidth="1.3"
      />
    </svg>
  );
};

