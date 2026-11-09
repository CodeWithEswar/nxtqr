import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const BatchProcessorIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Batch Processor",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeGreen = isColored ? "#34D399" : "#A3A3A3";
  const fillBatch = isColored ? "#064E3B" : "#1A1A1A";
  const strokeAccent = isColored ? "#6EE7B7" : "#D4D4D4";
  const fillProc = isColored ? "#022C22" : "#262626";
  const strokePath = isColored ? "#10B981" : "#737373";
  const fillDot = isColored ? "#A7F3D0" : "#E5E5E5";

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
      {/* 3 Input Stacked Workload Batches (Left) */}
      {/* Batch Layer 1 */}
      <rect
        x="3.5"
        y="6"
        width="11"
        height="5.5"
        rx="1.5"
        fill={fillBatch}
        stroke={strokeGreen}
        strokeWidth="1.2"
      />
      <circle cx="6.5" cy="8.75" r="1" fill={fillDot} />
      <path d="M9 8.75h3.5" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" />

      {/* Batch Layer 2 */}
      <rect
        x="3.5"
        y="13.25"
        width="11"
        height="5.5"
        rx="1.5"
        fill={fillBatch}
        stroke={strokeGreen}
        strokeWidth="1.2"
      />
      <circle cx="6.5" cy="16" r="1" fill={fillDot} />
      <path d="M9 16h3.5" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" />

      {/* Batch Layer 3 */}
      <rect
        x="3.5"
        y="20.5"
        width="11"
        height="5.5"
        rx="1.5"
        fill={fillBatch}
        stroke={strokeGreen}
        strokeWidth="1.2"
      />
      <circle cx="6.5" cy="23.25" r="1" fill={fillDot} />
      <path d="M9 23.25h3.5" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" />

      {/* Batch Ingestion & Aggregation Arrows */}
      <path
        d="M15.5 8.75l3 4.25M15.5 16h3M15.5 23.25l3-4.25"
        stroke={strokePath}
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* High-Throughput Batch Processing Engine / Aggregation Matrix (Right) */}
      <rect
        x="20.5"
        y="7.5"
        width="8"
        height="17"
        rx="2"
        fill={fillProc}
        stroke={strokeGreen}
        strokeWidth="1.5"
      />
      {/* Pipeline transformation indicator */}
      <path
        d="M24.5 11v10M22.5 14h4M22.5 18h4"
        stroke={strokeAccent}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="24.5" cy="11" r="1.2" fill={fillDot} />
      <circle cx="24.5" cy="21" r="1.2" fill={fillDot} />
    </svg>
  );
};
