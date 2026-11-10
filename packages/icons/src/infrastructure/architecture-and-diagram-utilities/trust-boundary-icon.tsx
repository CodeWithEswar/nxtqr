import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const TrustBoundaryIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Trust Boundary",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokePrimary = isColored ? "#F87171" : "#A3A3A3";
  const strokeAccent = isColored ? "#FECACA" : "#E5E5E5";
  const fillFoundation = isColored ? "#450A0A" : "#141414";
  const fillSurface = isColored ? "#7F1D1D" : "#1F1F1F";
  const secureKeyFill = isColored ? "#EF4444" : "#404040";

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
      {/* Untrusted / Public Zone (Left) */}
      <rect
        x="3"
        y="5"
        width="11"
        height="22"
        rx="2"
        fill={fillFoundation}
        stroke={strokePrimary}
        strokeWidth="1"
        strokeDasharray="2 2"
      />
      {/* Untrusted Node Symbol */}
      <circle cx="8.5" cy="11" r="2" fill="none" stroke={strokeAccent} strokeWidth="1" />
      <path d="M6 18C6 16.5 7 15.5 8.5 15.5C10 15.5 11 16.5 11 18" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" />

      {/* Trusted / Internal Zone (Right) */}
      <rect
        x="18"
        y="5"
        width="11"
        height="22"
        rx="2"
        fill={fillSurface}
        stroke={strokePrimary}
        strokeWidth="1.2"
      />
      {/* Trusted Node Symbol */}
      <circle cx="23.5" cy="11" r="2" fill="none" stroke={strokeAccent} strokeWidth="1" />
      <path d="M21 18C21 16.5 22 15.5 23.5 15.5C25 15.5 26 16.5 26 18" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" />

      {/* Central Security Transition Dividing Line */}
      <path
        d="M16 3V29"
        stroke={strokePrimary}
        strokeWidth="1.5"
        strokeDasharray="3 2"
      />

      {/* Central Verification Checkpoint Badge */}
      <rect
        x="13.5"
        y="13"
        width="5"
        height="6"
        rx="1"
        fill={secureKeyFill}
        stroke={strokeAccent}
        strokeWidth="0.8"
      />
      <circle cx="16" cy="15.5" r="0.8" fill={strokeAccent} />
      <path d="M16 16.5V18" stroke={strokeAccent} strokeWidth="0.8" strokeLinecap="round" />

      {/* Protected Crossing Arrow passing through checkpoint */}
      <path
        d="M10 23L15 23L22 23"
        stroke={strokeAccent}
        strokeWidth="1"
        strokeLinecap="round"
        strokeDasharray="1.5 1.5"
      />
      <path
        d="M20 21L22 23L20 25"
        stroke={strokeAccent}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
