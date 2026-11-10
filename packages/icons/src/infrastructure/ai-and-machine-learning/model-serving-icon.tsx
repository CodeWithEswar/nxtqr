import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const ModelServingIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Model Serving",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#A855F7" : "#A3A3A3";
  const strokeAccent = isColored ? "#C084FC" : "#E5E5E5";
  const fillFoundation = isColored ? "#2E1065" : "#141414";
  const fillTransform = isColored ? "#581C87" : "#262626";
  const fillHighlight = isColored ? "#7E22CE" : "#333333";
  const accentNeon = isColored ? "#F472B6" : "#E5E5E5";

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
      {/* Outer Server / Accelerator Package Chassis */}
      <rect
        x="3"
        y="4"
        width="26"
        height="24"
        rx="3"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.2"
      />

      {/* Die Surface */}
      <rect
        x="7"
        y="8"
        width="18"
        height="16"
        rx="2"
        fill={fillTransform}
        stroke={strokeAccent}
        strokeWidth="1.1"
      />

      {/* Neural Core Grid / Tensor Units */}
      <circle cx="11" cy="12" r="1.5" fill={accentNeon} />
      <circle cx="16" cy="12" r="1.5" fill={fillHighlight} stroke={strokeAccent} strokeWidth="0.8" />
      <circle cx="21" cy="12" r="1.5" fill={accentNeon} />

      <circle cx="11" cy="16" r="1.5" fill={fillHighlight} stroke={strokeAccent} strokeWidth="0.8" />
      <circle cx="16" cy="16" r="2" fill={accentNeon} />
      <circle cx="21" cy="16" r="1.5" fill={fillHighlight} stroke={strokeAccent} strokeWidth="0.8" />

      <circle cx="11" cy="20" r="1.5" fill={accentNeon} />
      <circle cx="16" cy="20" r="1.5" fill={fillHighlight} stroke={strokeAccent} strokeWidth="0.8" />
      <circle cx="21" cy="20" r="1.5" fill={accentNeon} />

      {/* Synaptic Interconnect Lines */}
      <path
        d="M11 12L16 16M21 12L16 16M11 20L16 16M21 20L16 16M11 12H21M11 20H21"
        stroke={strokeAccent}
        strokeWidth="0.75"
        strokeOpacity={isColored ? "0.6" : "0.4"}
      />

      {/* Input / Output Pulse Pins */}
      <path d="M16 1.5V4M16 28V30.5M1.5 16H4M28 16H30.5" stroke={strokeColor} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
};
