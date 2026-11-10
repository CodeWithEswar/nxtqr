import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const TrafficLabelIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Traffic Label",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokePrimary = isColored ? "#34D399" : "#A3A3A3";
  const strokeAccent = isColored ? "#A7F3D0" : "#E5E5E5";
  const fillFoundation = isColored ? "#064E3B" : "#141414";
  const fillTag = isColored ? "#065F46" : "#1F1F1F";

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
      {/* Primary Edge Wire Connection */}
      <path
        d="M3 16H29"
        stroke={strokePrimary}
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Terminal Node Endpoints */}
      <circle cx="4" cy="16" r="2" fill={strokeAccent} />
      <circle cx="28" cy="16" r="2" fill={strokeAccent} />

      {/* Directed Edge Direction Arrow */}
      <path
        d="M24 13L27 16L24 19"
        stroke={strokeAccent}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Attached Floating Traffic Label Pill */}
      <rect
        x="8"
        y="5"
        width="16"
        height="7.5"
        rx="2"
        fill={fillFoundation}
        stroke={strokePrimary}
        strokeWidth="1"
      />

      {/* Protocol Label Wave / Telemetry Indicator */}
      <path
        d="M10.5 8.75H12L13 6.5L14.5 11L15.5 8.75H21.5"
        stroke={strokeAccent}
        strokeWidth="0.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Label Pointer Attachment Line to Edge */}
      <path
        d="M16 12.5V16"
        stroke={strokePrimary}
        strokeWidth="1"
        strokeDasharray="1 1"
      />
      <circle cx="16" cy="16" r="1.2" fill={strokeAccent} />

      {/* Bottom Assumed Metric Indicator */}
      <rect
        x="9"
        y="21"
        width="14"
        height="5"
        rx="1.5"
        fill={fillTag}
        stroke={strokePrimary}
        strokeWidth="0.8"
      />
      <path d="M12 23.5H20" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
};
