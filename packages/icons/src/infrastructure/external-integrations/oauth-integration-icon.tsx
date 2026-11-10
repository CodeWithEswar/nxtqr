import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const OauthIntegrationIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "OAuth Integration",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#A78BFA" : "#A3A3A3";
  const strokeAccent = isColored ? "#DDD6FE" : "#D4D4D4";
  const fillFoundation = isColored ? "#2E1065" : "#141414";
  const fillSurface = isColored ? "#4C1D95" : "#1F1F1F";

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
      {/* Outer External Authorization Server Perimeter */}
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

      {/* Delegated Security Key / Token Container */}
      <circle
        cx="16"
        cy="13"
        r="4.5"
        fill={fillSurface}
        stroke={strokeColor}
        strokeWidth="1.2"
      />

      {/* Internal Keyhole Silhouette */}
      <circle cx="16" cy="12" r="1.2" fill={strokeAccent} />
      <path d="M15.2 13H16.8L17.2 15.2H14.8L15.2 13Z" fill={strokeAccent} />

      {/* Authorization Code Redirect Loop & Token Exchange */}
      <path
        d="M9 22C9 19.5 12.1 18 16 18C19.9 18 23 19.5 23 22"
        stroke={strokeColor}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M10 24.5H22M22 24.5L19.5 22.5M22 24.5L19.5 26.5"
        stroke={strokeAccent}
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

OauthIntegrationIcon.displayName = "OauthIntegrationIcon";

