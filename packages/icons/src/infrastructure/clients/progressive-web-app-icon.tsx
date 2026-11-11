import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const ProgressiveWebAppIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Progressive Web Application",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeChassis = isColored ? "#60A5FA" : "#D4D4D4";
  const fillTitleBar = isColored ? "#1D4ED8" : "#262626";
  const fillDot1 = isColored ? "#38BDF8" : "#FFFFFF";
  const fillDot2 = isColored ? "#60A5FA" : "#D4D4D4";
  const strokeCircle = isColored ? "#A78BFA" : "#A3A3A3";
  const fillBadge = isColored ? "#0F172A" : "#141414";
  const fillBolt = isColored ? "#38BDF8" : "#FFFFFF";
  const strokeBolt = isColored ? "#60A5FA" : "#D4D4D4";

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
      {/* Mobile/Web Hybrid Chassis */}
      <rect
        x="6"
        y="4"
        width="20"
        height="24"
        rx="3.5"
        fill="#080808"
        stroke={strokeChassis}
        strokeWidth="1.5"
      />
      {/* Top Header Bar */}
      <path
        d="M6 7.5A3.5 3.5 0 0 1 9.5 4h13A3.5 3.5 0 0 1 26 7.5V10H6V7.5z"
        fill={fillTitleBar}
      />
      {/* Title Dots */}
      <circle cx="9.5" cy="7" r="0.8" fill={fillDot1} />
      <circle cx="12" cy="7" r="0.8" fill={fillDot2} />

      {/* Offline PWA Sync Circle */}
      <circle
        cx="16"
        cy="18"
        r="6"
        stroke={strokeCircle}
        strokeWidth="1.25"
        strokeDasharray="3 1.5"
        fill={fillBadge}
      />

      {/* Instant Offline Lightning Bolt */}
      <path
        d="M16.5 13.5l-3 4.5h3l-1 4.5 4-5.5h-3l1-3.5z"
        fill={fillBolt}
        stroke={strokeBolt}
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
    </svg>
  );
};

