import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const EmailProviderIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Email Provider",
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
      {/* Outer External Relay Perimeter */}
      <rect
        x="3"
        y="5"
        width="26"
        height="22"
        rx="4"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.2"
        strokeDasharray="2.5 1.5"
      />

      {/* Main Mail Envelope Body */}
      <rect
        x="6"
        y="9"
        width="20"
        height="14"
        rx="2.5"
        fill={fillSurface}
        stroke={strokeColor}
        strokeWidth="1.2"
      />

      {/* Envelope Flap Creases */}
      <path
        d="M6 10L16 17.5L26 10"
        stroke={strokeAccent}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 22L12 16M26 22L20 16"
        stroke={strokeColor}
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Outbound Delivery Stamp / Telemetry Node */}
      <circle cx="21" cy="7" r="3.5" fill={fillSurface} stroke={strokeAccent} strokeWidth="1.2" />
      <path
        d="M20 6L22.5 7L20 8"
        stroke={strokeAccent}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

EmailProviderIcon.displayName = "EmailProviderIcon";
