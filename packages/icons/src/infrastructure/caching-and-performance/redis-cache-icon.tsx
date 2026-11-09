import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const RedisCacheIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Redis Cache",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeRed = isColored ? "#F87171" : "#A3A3A3";
  const fillFoundation = isColored ? "#7F1D1D" : "#1A1A1A";
  const strokeAccent = isColored ? "#FECACA" : "#E5E5E5";
  const strokeSubtle = isColored ? "#EF4444" : "#737373";
  const fillMid = isColored ? "#991B1B" : "#262626";

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
      {/* Bottom In-Memory Layer (Isometric Prism) */}
      <path
        d="M16 26.5l-9.5-4.5v-3.5l9.5 4.5 9.5-4.5v3.5L16 26.5z"
        fill={fillFoundation}
        stroke={strokeRed}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Middle Memory Layer */}
      <path
        d="M16 20.5l-9.5-4.5v-3.5l9.5 4.5 9.5-4.5v3.5L16 20.5z"
        fill={fillMid}
        stroke={strokeRed}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Top Memory Layer (Hero Platter) */}
      <path
        d="M16 8.5l9.5 4.5-9.5 4.5-9.5-4.5 9.5-4.5z"
        fill={fillFoundation}
        stroke={strokeRed}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 13v3l9.5 4.5 9.5-4.5v-3"
        stroke={strokeRed}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* In-Memory Data Slots / Partition Grid Lines */}
      <path
        d="M11 11l5 2.4 5-2.4"
        stroke={strokeSubtle}
        strokeWidth="1.1"
        strokeLinecap="round"
      />

      {/* Core Ultra-Low-Latency Flash Indicator */}
      <circle cx="16" cy="13" r="1.5" fill={strokeAccent} />

      {/* Memory Bus Speed Lines */}
      <path
        d="M16 5v2M12 6.5l1.5 1.5M20 6.5l-1.5 1.5"
        stroke={strokeAccent}
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
};
