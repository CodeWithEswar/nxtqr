import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const SessionCacheIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Session Cache",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeGreen = isColored ? "#34D399" : "#A3A3A3";
  const fillFoundation = isColored ? "#064E3B" : "#1A1A1A";
  const strokeAccent = isColored ? "#A7F3D0" : "#E5E5E5";
  const strokeSubtle = isColored ? "#059669" : "#737373";
  const fillBadge = isColored ? "#065F46" : "#262626";

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
      {/* Outer Session Memory Bank */}
      <rect
        x="5"
        y="6"
        width="22"
        height="20"
        rx="2"
        fill={fillFoundation}
        stroke={strokeGreen}
        strokeWidth="1.5"
      />

      {/* Internal Session User Avatar Token / Badge */}
      <rect
        x="8.5"
        y="9.5"
        width="15"
        height="13"
        rx="1.5"
        fill={fillBadge}
        stroke={strokeSubtle}
        strokeWidth="1.2"
      />

      {/* User Session Avatar Silhouette */}
      <circle cx="16" cy="14" r="2.2" fill={strokeAccent} />
      <path
        d="M12.5 20c0-1.9 1.6-3.4 3.5-3.4s3.5 1.5 3.5 3.4"
        stroke={strokeAccent}
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Sliding TTL / Expiration Token Indicator (Bottom Right) */}
      <circle cx="22" cy="22" r="3.75" fill={fillFoundation} stroke={strokeGreen} strokeWidth="1.2" />
      <path
        d="M22 20v2l1.2 1.2"
        stroke={strokeAccent}
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Ingress Auth Key Connector */}
      <path
        d="M2.5 16h2.5M27 16h2.5"
        stroke={strokeGreen}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
};
