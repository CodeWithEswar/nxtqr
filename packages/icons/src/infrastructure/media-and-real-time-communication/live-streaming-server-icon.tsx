import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const LiveStreamingServerIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Live Streaming Server",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#F87171" : "#A3A3A3";
  const strokeAccent = isColored ? "#FCA5A5" : "#D4D4D4";
  const fillFoundation = isColored ? "#450A0A" : "#141414";
  const fillSurface = isColored ? "#7F1D1D" : "#1F1F1F";

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
      {/* Central Ingestion & Packaging Engine Base */}
      <rect
        x="6"
        y="17"
        width="20"
        height="11"
        rx="2"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.3"
      />
      {/* Segment Buffers / Live Pipeline Indicator */}
      <line x1="10" y1="21" x2="14" y2="21" stroke={strokeAccent} strokeWidth="1.1" strokeLinecap="round" />
      <line x1="10" y1="24" x2="18" y2="24" stroke={strokeAccent} strokeWidth="1.1" strokeLinecap="round" />
      <circle cx="22" cy="22.5" r="1.5" fill={isColored ? "#F87171" : "#A3A3A3"} />

      {/* Broadcast Transmission Tower / Antenna */}
      <path
        d="M16 17V8"
        stroke={strokeColor}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="16" cy="8" r="2.5" fill={fillSurface} stroke={strokeColor} strokeWidth="1.2" />
      <circle cx="16" cy="8" r="1" fill={isColored ? "#F87171" : "#FFFFFF"} />

      {/* Live Broadcast Radio / Stream Wave Arcs (Left & Right) */}
      <path
        d="M11 5C9 7 9 9 11 11"
        stroke={strokeAccent}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M8 2.5C5 5.5 5 10.5 8 13.5"
        stroke={strokeColor}
        strokeWidth="1.1"
        strokeLinecap="round"
      />

      <path
        d="M21 5C23 7 23 9 21 11"
        stroke={strokeAccent}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M24 2.5C27 5.5 27 10.5 24 13.5"
        stroke={strokeColor}
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
};

