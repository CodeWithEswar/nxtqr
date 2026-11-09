import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const ThirdPartyClientIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Third-Party Client",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeBoundary = isColored ? "#2563EB" : "#737373";
  const strokeCard = isColored ? "#60A5FA" : "#A3A3A3";
  const fillCard = isColored ? "#0F172A" : "#1A1A1A";
  const strokeArrow = isColored ? "#38BDF8" : "#E5E5E5";
  const fillNode = isColored ? "#A78BFA" : "#D4D4D4";
  const strokeNode = isColored ? "#38BDF8" : "#858585";
  const strokeHandshake = isColored ? "#CBD5E1" : "#737373";

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
      {/* External Integration Trust Boundary */}
      <rect
        x="4"
        y="5"
        width="24"
        height="22"
        rx="3"
        fill="#080808"
        stroke={strokeBoundary}
        strokeWidth="1.5"
        strokeDasharray="3 2"
      />

      {/* Embedded Partner Client Box */}
      <rect
        x="7"
        y="8"
        width="18"
        height="16"
        rx="2"
        fill={fillCard}
        stroke={strokeCard}
        strokeWidth="1.25"
      />

      {/* External Egress Connector Arrow */}
      <path
        d="M19 11l5-5m0 0h-3.5m3.5 0v3.5"
        stroke={strokeArrow}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Secure API Key / Handshake Node */}
      <circle cx="12.5" cy="16" r="2.5" fill={fillNode} stroke={strokeNode} strokeWidth="1" />
      {/* Handshake Bridge Line */}
      <path
        d="M15 16h5.5"
        stroke={strokeHandshake}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
};
