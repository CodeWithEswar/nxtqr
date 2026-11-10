import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const PushNotificationServiceIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Push Notification Service",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#C4B5FD" : "#A3A3A3";
  const strokeAccent = isColored ? "#DDD6FE" : "#D4D4D4";
  const fillFoundation = isColored ? "#1E1B4B" : "#141414";
  const fillSurface = isColored ? "#312E81" : "#1F1F1F";

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
      {/* Device / Smartphone Outer Contour */}
      <rect
        x="7"
        y="4"
        width="18"
        height="25"
        rx="3"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.3"
      />
      {/* Home / Speaker Bar */}
      <line x1="13" y1="6.5" x2="19" y2="6.5" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" />
      <circle cx="16" cy="26" r="1.2" fill={strokeAccent} />

      {/* Floating Push Notification Banner Card */}
      <rect
        x="3"
        y="11"
        width="26"
        height="10"
        rx="2"
        fill={fillSurface}
        stroke={strokeColor}
        strokeWidth="1.2"
      />

      {/* Push Notification Icon & Payload Text Lines */}
      <circle cx="7.5" cy="16" r="2" fill={isColored ? "#C4B5FD" : "#D4D4D4"} />
      <line x1="12" y1="14.5" x2="22" y2="14.5" stroke={strokeAccent} strokeWidth="1.1" strokeLinecap="round" />
      <line x1="12" y1="17.5" x2="18" y2="17.5" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" />

      {/* Real-Time Push Delivery Signal Waves (Top Corner) */}
      <path
        d="M23 7C24.5 8 25 9.5 25 11"
        stroke={strokeAccent}
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <circle cx="26" cy="6" r="1" fill={isColored ? "#F87171" : "#A3A3A3"} />
    </svg>
  );
};

