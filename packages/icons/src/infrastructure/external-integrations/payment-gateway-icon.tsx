import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const PaymentGatewayIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Payment Gateway",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#34D399" : "#A3A3A3";
  const strokeAccent = isColored ? "#A7F3D0" : "#D4D4D4";
  const fillFoundation = isColored ? "#064E3B" : "#141414";
  const fillSurface = isColored ? "#065F46" : "#1F1F1F";
  const badgeFill = isColored ? "#047857" : "#262626";

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
      {/* Outer Payment Security Perimeter */}
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

      {/* Credit / Debit Card Terminal Surface */}
      <rect
        x="6"
        y="8"
        width="20"
        height="13"
        rx="2.5"
        fill={fillSurface}
        stroke={strokeColor}
        strokeWidth="1.1"
      />

      {/* Magnetic Stripe / EMV Header Band */}
      <line x1="6" y1="12" x2="26" y2="12" stroke={strokeColor} strokeWidth="1.5" />

      {/* EMV Chip Representation */}
      <rect x="9" y="14.5" width="3.5" height="3" rx="0.8" fill={strokeAccent} />

      {/* Secure Transaction Verification Shield Badge */}
      <path
        d="M21 16.5V19.5C21 21.8 19 23.5 17 24.5C15 23.5 13 21.8 13 19.5V16.5L17 15L21 16.5Z"
        fill={badgeFill}
        stroke={strokeAccent}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Status Verified Checkmark inside Shield */}
      <path
        d="M15 19.5L16.5 21L19.2 18"
        stroke={strokeAccent}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

PaymentGatewayIcon.displayName = "PaymentGatewayIcon";
