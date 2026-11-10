import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const CloudFunctionIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Cloud Function",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#C4B5FD" : "#A3A3A3";
  const strokeAccent = isColored ? "#EDE9FE" : "#D4D4D4";
  const fillFoundation = isColored ? "#2E1065" : "#141414";
  const fillSurface = isColored ? "#5B21B6" : "#1F1F1F";

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
      {/* Serverless Ephemeral Enclosure */}
      <rect
        x="4.5"
        y="4.5"
        width="23"
        height="23"
        rx="3"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.3"
      />

      {/* Central Execution Core Background Badge */}
      <circle cx="16" cy="18" r="5.5" fill={fillSurface} stroke={strokeColor} strokeWidth="1" />

      {/* Mathematical Lambda Execution Core / Function Symbol */}
      <path
        d="M12.5 21.5L16 14.5M15 17L18.5 21.5"
        stroke={strokeAccent}
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* Event Ingress Trigger Flash (Top Left) */}
      <path
        d="M6 7L10 10M10 7L6 10"
        stroke={strokeColor}
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Cold-Start / Ephemeral Container Dot Indicator */}
      <circle cx="16" cy="10" r="1.5" fill={strokeAccent} />

      {/* Serverless Execution Output Path (Bottom Right) */}
      <path
        d="M20 18L24 18M24 18L22 16M24 18L22 20"
        stroke={strokeColor}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
