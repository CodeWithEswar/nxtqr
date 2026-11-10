import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const ThirdPartyWebhookIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Third-Party Webhook",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#F87171" : "#A3A3A3";
  const strokeAccent = isColored ? "#FECACA" : "#D4D4D4";
  const fillFoundation = isColored ? "#450A0A" : "#141414";
  const fillSurface = isColored ? "#7F1D1D" : "#1F1F1F";

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
      {/* Outer External Callback Boundary */}
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

      {/* Webhook Hook Path & Inbound Event Vector */}
      <path
        d="M9 8V14C9 17.5 11.5 20 15 20H19"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="9" cy="8" r="2.5" fill={fillSurface} stroke={strokeAccent} strokeWidth="1.2" />

      {/* Incoming Event Payload Container (Square with Arrow) */}
      <rect
        x="18"
        y="14"
        width="9"
        height="10"
        rx="2"
        fill={fillSurface}
        stroke={strokeAccent}
        strokeWidth="1.2"
      />
      {/* Cryptographic Signature Hash Lines */}
      <line x1="20.5" y1="17.5" x2="24.5" y2="17.5" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" />
      <line x1="20.5" y1="20.5" x2="23" y2="20.5" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" />

      {/* Lightning Inbound Event Dispatch Indicator */}
      <path
        d="M14 10.5L12 14H15L13.5 17.5"
        stroke={strokeAccent}
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

ThirdPartyWebhookIcon.displayName = "ThirdPartyWebhookIcon";
