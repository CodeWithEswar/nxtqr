import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const SmsProviderIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "SMS Provider",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#FB923C" : "#A3A3A3";
  const strokeAccent = isColored ? "#FED7AA" : "#D4D4D4";
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
      {/* Outer Telecommunications Boundary */}
      <rect
        x="3"
        y="4"
        width="26"
        height="24"
        rx="4"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.2"
        strokeDasharray="2.5 1.5"
      />

      {/* SMS Message Bubble */}
      <path
        d="M7 9C7 7.9 7.9 7 9 7H21C22.1 7 23 7.9 23 9V17C23 18.1 22.1 19 21 19H13L9 22V19H9C7.9 19 7 18.1 7 17V9Z"
        fill={fillSurface}
        stroke={strokeColor}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Text Message Content Glyph Lines */}
      <line x1="10" y1="11" x2="18" y2="11" stroke={strokeAccent} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="10" y1="14.5" x2="16" y2="14.5" stroke={strokeAccent} strokeWidth="1.2" strokeLinecap="round" />

      {/* Cellular Carrier Transmission Signal Bars (Bottom Right) */}
      <rect x="18" y="24" width="1.5" height="2" rx="0.5" fill={strokeColor} />
      <rect x="21" y="22.5" width="1.5" height="3.5" rx="0.5" fill={strokeColor} />
      <rect x="24" y="21" width="1.5" height="5" rx="0.5" fill={strokeAccent} />
    </svg>
  );
};

SmsProviderIcon.displayName = "SmsProviderIcon";
