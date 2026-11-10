import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const LogCollectorIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Log Collector",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeAmber = isColored ? "#FBBF24" : "#A3A3A3";
  const fillFoundation = isColored ? "#451A03" : "#141414";
  const strokeAccent = isColored ? "#FDE68A" : "#E5E5E5";
  const fillDoc = isColored ? "#92400E" : "#1F1F1F";

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
      {/* Log Document Sheet / Buffer Register */}
      <rect
        x="5"
        y="3.5"
        width="22"
        height="25"
        rx="3"
        fill={fillFoundation}
        stroke={strokeAmber}
        strokeWidth="1.5"
      />

      {/* Internal Log Ingestion Chamber */}
      <rect
        x="7.5"
        y="6"
        width="17"
        height="20"
        rx="1.8"
        fill={fillDoc}
        stroke={strokeAmber}
        strokeWidth="1"
      />

      {/* Structured Log Line 1 (Timestamp + Level) */}
      <line x1="10" y1="9.5" x2="13" y2="9.5" stroke={strokeAccent} strokeWidth="1.4" strokeLinecap="round" />
      <line x1="15" y1="9.5" x2="22" y2="9.5" stroke={strokeAmber} strokeWidth="1.2" strokeLinecap="round" strokeDasharray="1.5 1.5" />

      {/* Structured Log Line 2 (Message Payload) */}
      <line x1="10" y1="13.5" x2="14" y2="13.5" stroke={strokeAccent} strokeWidth="1.4" strokeLinecap="round" />
      <line x1="16" y1="13.5" x2="21" y2="13.5" stroke={strokeAccent} strokeWidth="1.2" strokeLinecap="round" />

      {/* Structured Log Line 3 (Trace Context Hash) */}
      <line x1="10" y1="17.5" x2="12.5" y2="17.5" stroke={strokeAccent} strokeWidth="1.4" strokeLinecap="round" />
      <line x1="14.5" y1="17.5" x2="19" y2="17.5" stroke={strokeAmber} strokeWidth="1.2" strokeLinecap="round" />

      {/* Active Log Ingestion / Tail Arrow Emitter */}
      <g transform="translate(16, 21.5)">
        <path
          d="M-3 -0.5L0 2.5L3 -0.5"
          stroke={strokeAccent}
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line x1="0" y1="-2.5" x2="0" y2="2" stroke={strokeAccent} strokeWidth="1.3" strokeLinecap="round" />
      </g>
    </svg>
  );
};

