import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const CloudIamIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Cloud IAM",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#F87171" : "#A3A3A3";
  const strokeAccent = isColored ? "#FECACA" : "#D4D4D4";
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
      {/* Policy Boundary Shield Enclosure */}
      <path
        d="M16 4L26 8V16C26 22 21.5 26.5 16 28C10.5 26.5 6 22 6 16V8L16 4Z"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />

      {/* Identity Principal (User / Service Account Head) */}
      <circle cx="16" cy="11.5" r="3" fill={fillSurface} stroke={strokeAccent} strokeWidth="1.1" />

      {/* Role / Policy Torso */}
      <path
        d="M11.5 20C11.5 17.5 13.5 16 16 16C18.5 16 20.5 17.5 20.5 20"
        stroke={strokeAccent}
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Access Permission Key Hole / Grant Token */}
      <rect x="14.5" y="21" width="3" height="4" rx="1" fill={strokeAccent} />
      <circle cx="16" cy="22" r="0.6" fill={fillFoundation} />
    </svg>
  );
};
