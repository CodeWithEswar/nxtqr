import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const OpenIDConnectProviderIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "OpenID Connect Provider",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeCyan = isColored ? "#38BDF8" : "#A3A3A3";
  const fillDeep = isColored ? "#0C4A6E" : "#262626";
  const fillFoundation = isColored ? "#082F49" : "#141414";
  const strokeAccent = isColored ? "#BAE6FD" : "#E5E5E5";
  const strokeBlue = isColored ? "#60A5FA" : "#D4D4D4";

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
      {/* OIDC Foundation Card (ID Token Document) */}
      <rect
        x="4.5"
        y="5"
        width="23"
        height="22"
        rx="3"
        fill={fillFoundation}
        stroke={strokeCyan}
        strokeWidth="1.5"
      />

      {/* ID Token Header & Claims Partition */}
      <line x1="4.5" y1="12" x2="27.5" y2="12" stroke={strokeCyan} strokeWidth="1.2" />

      {/* Header Claims (sub, iss, aud) Visual Bars */}
      <line x1="8" y1="8.5" x2="14" y2="8.5" stroke={strokeAccent} strokeWidth="1.4" strokeLinecap="round" />
      <line x1="16" y1="8.5" x2="20" y2="8.5" stroke={strokeCyan} strokeWidth="1.4" strokeLinecap="round" />

      {/* Left Claims Profile Emblem (Subject User Avatar) */}
      <circle cx="11.5" cy="18" r="2.5" fill={fillDeep} stroke={strokeAccent} strokeWidth="1.2" />
      <path
        d="M7.5 24C7.5 22 9.5 21 11.5 21C13.5 21 15.5 22 15.5 24"
        stroke={strokeAccent}
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Right Claims Key-Value Data Rows */}
      <line x1="18" y1="16.5" x2="24" y2="16.5" stroke={strokeAccent} strokeWidth="1.3" strokeLinecap="round" />
      <line x1="18" y1="19.5" x2="23" y2="19.5" stroke={strokeBlue} strokeWidth="1.3" strokeLinecap="round" />
      <line x1="18" y1="22.5" x2="21" y2="22.5" stroke={strokeAccent} strokeWidth="1.3" strokeLinecap="round" />

      {/* Cryptographic Signature Seal Badge (JWKS verified) */}
      <circle cx="23.5" cy="8.5" r="2" fill={fillDeep} stroke={strokeAccent} strokeWidth="1" />
      <circle cx="23.5" cy="8.5" r="0.75" fill={strokeAccent} />
    </svg>
  );
};
