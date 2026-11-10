import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const NotificationGatewayIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Notification Gateway",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#FBBF24" : "#A3A3A3";
  const strokeAccent = isColored ? "#FDE68A" : "#D4D4D4";
  const fillFoundation = isColored ? "#451A03" : "#141414";
  const fillSurface = isColored ? "#78350F" : "#1F1F1F";

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
      {/* Central Routing Gateway Enclosure */}
      <rect
        x="10"
        y="9"
        width="12"
        height="14"
        rx="2"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.3"
      />

      {/* Internal Notification Bell Symbol */}
      <path
        d="M16 11C14.8 11 14 11.8 14 13V15.5L13 17H19L18 15.5V13C18 11.8 17.2 11 16 11Z"
        fill={fillSurface}
        stroke={strokeAccent}
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="18.5" r="0.8" fill={strokeAccent} />

      {/* Ingress Notification Request (Left Input) */}
      <path
        d="M3 16H8M8 16L6 14M8 16L6 18"
        stroke={strokeColor}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Multi-Channel Fanout Egress Channels (Right Outputs) */}
      {/* Push Channel */}
      <path
        d="M22 12H27M27 12L25 10.5M27 12L25 13.5"
        stroke={strokeAccent}
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="28.5" cy="12" r="1.2" fill={isColored ? "#FBBF24" : "#A3A3A3"} />

      {/* SMS / Telco Channel */}
      <path
        d="M22 16H27M27 16L25 14.5M27 16L25 17.5"
        stroke={strokeColor}
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="28.5" cy="16" r="1.2" fill={isColored ? "#38BDF8" : "#A3A3A3"} />

      {/* Email / Webhook Channel */}
      <path
        d="M22 20H27M27 20L25 18.5M27 20L25 21.5"
        stroke={strokeAccent}
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="28.5" cy="20" r="1.2" fill={isColored ? "#34D399" : "#D4D4D4"} />

      {/* Top Routing Status Signal */}
      <circle cx="16" cy="5" r="1.5" fill={isColored ? "#FBBF24" : "#A3A3A3"} />
      <line x1="16" y1="6.5" x2="16" y2="9" stroke={strokeColor} strokeWidth="1" />
    </svg>
  );
};

