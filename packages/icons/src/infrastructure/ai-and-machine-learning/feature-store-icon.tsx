import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const FeatureStoreIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Feature Store",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#8B5CF6" : "#A3A3A3";
  const strokeAccent = isColored ? "#A78BFA" : "#E5E5E5";
  const fillOnline = isColored ? "#2E1065" : "#141414";
  const fillOffline = isColored ? "#4C1D95" : "#262626";
  const accentGlow = isColored ? "#38BDF8" : "#E5E5E5";

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
      {/* 1. Online Fast-Lookup Table (Left Surface) */}
      <rect
        x="3"
        y="6"
        width="11"
        height="20"
        rx="2"
        fill={fillOnline}
        stroke={strokeColor}
        strokeWidth="1.2"
      />
      {/* Online slot rows */}
      <rect x="5.5" y="9" width="6" height="2.5" rx="0.75" fill={accentGlow} />
      <rect x="5.5" y="14" width="6" height="2.5" rx="0.75" fill={strokeAccent} />
      <rect x="5.5" y="19" width="6" height="2.5" rx="0.75" fill={strokeAccent} />

      {/* Online lightning indicator on top */}
      <path d="M8.5 2.5L7 5H10L8.5 7" stroke={accentGlow} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />

      {/* 2. Sync / Time-Travel Bridge (Middle Channel) */}
      <path
        d="M14 11H18M18 11L16.5 9.5M18 11L16.5 12.5"
        stroke={strokeAccent}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 21H14M14 21L15.5 19.5M14 21L15.5 22.5"
        stroke={strokeAccent}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 3. Offline Batch Cylinder / Delta Store (Right Surface) */}
      <path
        d="M18 10C18 8.6 20.7 7.5 24 7.5C27.3 7.5 30 8.6 30 10V22C30 23.4 27.3 24.5 24 24.5C20.7 24.5 18 23.4 18 22V10Z"
        fill={fillOffline}
        stroke={strokeColor}
        strokeWidth="1.2"
      />
      <ellipse cx="24" cy="10" rx="6" ry="2.5" fill={fillOnline} stroke={strokeColor} strokeWidth="1.2" />
      <path d="M18 14.5C18 15.9 20.7 17 24 17C27.3 17 30 15.9 30 14.5" stroke={strokeColor} strokeWidth="1" />
      <path d="M18 18.5C18 19.9 20.7 21 24 21C27.3 21 30 19.9 30 18.5" stroke={strokeColor} strokeWidth="1" />
    </svg>
  );
};
