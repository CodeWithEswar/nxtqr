import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const AuthenticationServiceIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Authentication Service",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeBlue = isColored ? "#60A5FA" : "#A3A3A3";
  const fillDeep = isColored ? "#1E3A8A" : "#262626";
  const fillFoundation = isColored ? "#0F172A" : "#141414";
  const strokeAccent = isColored ? "#93C5FD" : "#E5E5E5";
  const strokeGreen = isColored ? "#34D399" : "#D4D4D4";

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
      {/* Outer Security Boundary Badge */}
      <rect
        x="3.5"
        y="3.5"
        width="25"
        height="25"
        rx="4"
        fill={fillFoundation}
        stroke={strokeBlue}
        strokeWidth="1.5"
      />

      {/* Internal Credential Card Silhouette */}
      <rect
        x="6.5"
        y="6.5"
        width="19"
        height="19"
        rx="2"
        fill={fillDeep}
        stroke={strokeBlue}
        strokeWidth="1.2"
        strokeDasharray="2 2"
      />

      {/* Verified User Avatar Head & Torso */}
      <circle cx="16" cy="12.5" r="3" fill={fillFoundation} stroke={strokeAccent} strokeWidth="1.4" />
      <path
        d="M10.5 21C10.5 18 13 17 16 17C19 17 21.5 18 21.5 21"
        stroke={strokeAccent}
        strokeWidth="1.4"
        strokeLinecap="round"
      />

      {/* Identity Verification Checkmark Badge */}
      <circle cx="22" cy="9" r="4" fill={fillFoundation} stroke={strokeGreen} strokeWidth="1.2" />
      <path
        d="M20.2 9L21.4 10.2L23.8 7.8"
        stroke={strokeGreen}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
