import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const OAuthProviderIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "OAuth Provider",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeIndigo = isColored ? "#818CF8" : "#A3A3A3";
  const fillDeep = isColored ? "#312E81" : "#262626";
  const fillFoundation = isColored ? "#1E1B4B" : "#141414";
  const strokeAccent = isColored ? "#C7D2FE" : "#E5E5E5";
  const fillToken = isColored ? "#4338CA" : "#1F1F1F";

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
      {/* Client & Resource Authorization Ring (OAuth 2.0 Three-Legged Flow) */}
      <circle cx="16" cy="16" r="12" stroke={strokeIndigo} strokeWidth="1.5" strokeDasharray="5 2.5" />

      {/* Authorization Server Chassis */}
      <rect
        x="8"
        y="8"
        width="16"
        height="16"
        rx="3"
        fill={fillFoundation}
        stroke={strokeIndigo}
        strokeWidth="1.5"
      />

      {/* Grant Stamp / Token Vault Inset */}
      <rect
        x="10.5"
        y="10.5"
        width="11"
        height="11"
        rx="1.5"
        fill={fillDeep}
        stroke={strokeAccent}
        strokeWidth="1"
      />

      {/* Interlocking OAuth Keyhole & Token Mint Emblem */}
      <circle cx="16" cy="14" r="2.2" fill={fillToken} stroke={strokeAccent} strokeWidth="1.2" />
      <path
        d="M15 15.8L14.2 19H17.8L17 15.8"
        fill={fillToken}
        stroke={strokeAccent}
        strokeWidth="1.1"
      />

      {/* Grant Arrow Pointers (Auth Code -> Access Token) */}
      <path
        d="M4 16H6M26 16H28M16 4V6M16 26V28"
        stroke={strokeAccent}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
};
