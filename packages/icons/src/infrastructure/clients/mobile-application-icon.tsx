import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const MobileApplicationIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Mobile Application",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeChassis = isColored ? "#60A5FA" : "#D4D4D4";
  const strokeSpeaker = isColored ? "#93C5FD" : "#A3A3A3";
  const fillScreen = isColored ? "#0F172A" : "#141414";
  const fillApp1 = isColored ? "#60A5FA" : "#E5E5E5";
  const fillApp2 = isColored ? "#38BDF8" : "#D4D4D4";
  const fillApp3 = isColored ? "#A78BFA" : "#A3A3A3";
  const fillApp4 = isColored ? "#3B82F6" : "#737373";
  const fillHomeBar = isColored ? "#CBD5E1" : "#A3A3A3";
  const fillButton = isColored ? "#38BDF8" : "#E5E5E5";

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
      {/* Smartphone Chassis */}
      <rect
        x="8"
        y="2.5"
        width="16"
        height="27"
        rx="3.5"
        fill="#080808"
        stroke={strokeChassis}
        strokeWidth="1.5"
      />
      {/* Speaker / Camera Notch */}
      <path
        d="M13 5h6"
        stroke={strokeSpeaker}
        strokeWidth="1"
        strokeLinecap="round"
      />
      {/* Screen Area */}
      <rect x="9.5" y="7" width="13" height="18" rx="1.5" fill={fillScreen} />
      {/* App Grid */}
      <rect x="11" y="9" width="4" height="4" rx="1" fill={fillApp1} />
      <rect x="17" y="9" width="4" height="4" rx="1" fill={fillApp2} />
      <rect x="11" y="15" width="4" height="4" rx="1" fill={fillApp3} />
      <rect x="17" y="15" width="4" height="4" rx="1" fill={fillApp4} />
      {/* Gesture Home Bar */}
      <rect x="13" y="21.5" width="6" height="1.5" rx="0.75" fill={fillHomeBar} />
      {/* Bottom Hardware Indicator */}
      <circle cx="16" cy="27" r="1" fill={fillButton} />
    </svg>
  );
};

