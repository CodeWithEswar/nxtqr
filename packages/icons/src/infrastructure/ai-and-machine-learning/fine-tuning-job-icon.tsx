import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const FineTuningJobIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Fine-Tuning Job",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#EC4899" : "#A3A3A3";
  const strokeAccent = isColored ? "#F472B6" : "#E5E5E5";
  const fillBase = isColored ? "#500724" : "#141414";
  const fillAdapter = isColored ? "#831843" : "#262626";
  const accentSpark = isColored ? "#FBCFE8" : "#FFFFFF";

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
      {/* 1. Frozen Large Base Weights Backbone (Left Block) */}
      <rect
        x="3"
        y="6"
        width="12"
        height="20"
        rx="2"
        fill={fillBase}
        stroke={strokeColor}
        strokeWidth="1.2"
      />
      {/* Snowflake / Frozen Lock Symbol on Base */}
      <path d="M9 11V21M5 16H13M6.5 13.5L11.5 18.5M6.5 18.5L11.5 13.5" stroke={strokeColor} strokeWidth="1" strokeLinecap="round" opacity="0.6" />

      {/* 2. Plus / Combination Junction */}
      <circle cx="18" cy="16" r="2.5" fill={fillAdapter} stroke={strokeAccent} strokeWidth="1" />
      <path d="M18 14.5V17.5M16.5 16H19.5" stroke={accentSpark} strokeWidth="1.1" strokeLinecap="round" />

      {/* 3. LoRA Adapter Low-Rank Matrices (Right Blocks) */}
      {/* Matrix A: Down-projection */}
      <polygon
        points="23,9 29,12 29,15 23,12"
        fill={fillAdapter}
        stroke={strokeAccent}
        strokeWidth="1"
      />
      {/* Matrix B: Up-projection */}
      <polygon
        points="23,17 29,14 29,17 23,20"
        fill={fillAdapter}
        stroke={strokeAccent}
        strokeWidth="1"
      />

      {/* Tuning Sparkles / Gradients */}
      <circle cx="26" cy="24" r="1.5" fill={accentSpark} />
      <circle cx="29" cy="22" r="1" fill={strokeAccent} />
      <circle cx="24" cy="5" r="1.2" fill={strokeAccent} />

      {/* Connection arrow out */}
      <path d="M29 16H31" stroke={strokeAccent} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
};
