import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const VideoTranscoderIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Video Transcoder",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#FB923C" : "#A3A3A3";
  const strokeAccent = isColored ? "#FDBA74" : "#D4D4D4";
  const fillFoundation = isColored ? "#431407" : "#141414";
  const fillSurface = isColored ? "#7C2D12" : "#1F1F1F";

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
      {/* Input Raw Master Video Frame Strip (Left) */}
      <rect
        x="3"
        y="7"
        width="10"
        height="18"
        rx="2"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.3"
      />
      {/* Film Sprocket Holes */}
      <rect x="4.5" y="9" width="1.5" height="2" rx="0.3" fill={strokeAccent} />
      <rect x="4.5" y="13" width="1.5" height="2" rx="0.3" fill={strokeAccent} />
      <rect x="4.5" y="17" width="1.5" height="2" rx="0.3" fill={strokeAccent} />
      <rect x="4.5" y="21" width="1.5" height="2" rx="0.3" fill={strokeAccent} />
      <polygon points="8,14 11,16 8,18" fill={strokeAccent} />

      {/* Central Transcoding Conversion Arrows */}
      <path
        d="M14 14L17 16L14 18"
        stroke={strokeColor}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17 12L19 10"
        stroke={strokeAccent}
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <path
        d="M17 20L19 22"
        stroke={strokeAccent}
        strokeWidth="1.1"
        strokeLinecap="round"
      />

      {/* Multi-Resolution Transcoded Output Renditions Stack (Right) */}
      {/* 1080p High-Bitrate Profile */}
      <rect
        x="20"
        y="5"
        width="9"
        height="5.5"
        rx="1"
        fill={fillSurface}
        stroke={strokeColor}
        strokeWidth="1.1"
      />
      <line x1="22" y1="7.7" x2="26" y2="7.7" stroke={strokeAccent} strokeWidth="0.9" />

      {/* 720p Medium-Bitrate Profile */}
      <rect
        x="20"
        y="13"
        width="9"
        height="5.5"
        rx="1"
        fill={fillSurface}
        stroke={strokeColor}
        strokeWidth="1.1"
      />
      <line x1="22" y1="15.7" x2="25" y2="15.7" stroke={strokeAccent} strokeWidth="0.9" />

      {/* 480p Adaptive Mobile Profile */}
      <rect
        x="20"
        y="21"
        width="9"
        height="5.5"
        rx="1"
        fill={fillSurface}
        stroke={strokeColor}
        strokeWidth="1.1"
      />
      <line x1="22" y1="23.7" x2="24" y2="23.7" stroke={strokeAccent} strokeWidth="0.9" />
    </svg>
  );
};

