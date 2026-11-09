import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const EventProducerIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Event Producer",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeBlue = isColored ? "#60A5FA" : "#A3A3A3";
  const fillSource = isColored ? "#1E3A8A" : "#1A1A1A";
  const strokeAccent = isColored ? "#BFDBFE" : "#E5E5E5";
  const fillMessage = isColored ? "#1D4ED8" : "#262626";

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
      {/* Producer Source Service Module Enclosure */}
      <rect
        x="3"
        y="6"
        width="16"
        height="20"
        rx="3"
        fill={fillSource}
        stroke={strokeBlue}
        strokeWidth="1.5"
      />

      {/* Internal State / Event Generation Generator */}
      <circle cx="11" cy="12" r="3" fill={fillMessage} stroke={strokeAccent} strokeWidth="1.2" />
      <circle cx="11" cy="12" r="1.2" fill={strokeBlue} />

      {/* Emit Dispatch Trigger Track */}
      <path
        d="M6 19h10M6 22h6"
        stroke={strokeBlue}
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Outbound Egress Emission Arrow */}
      <path
        d="M19 16h3.5M21 14.5l1.5 1.5-1.5 1.5"
        stroke={strokeAccent}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Outgoing Dispatched Event Envelope (Right) */}
      <rect
        x="22.5"
        y="12"
        width="7"
        height="8"
        rx="1.5"
        fill={fillMessage}
        stroke={strokeAccent}
        strokeWidth="1.2"
      />
      {/* Event Envelope Fold Lines */}
      <path
        d="M22.5 13.5L26 16l3.5-2.5"
        stroke={strokeBlue}
        strokeWidth="1"
        strokeLinejoin="round"
      />

      {/* Broadcast Velocity Sparkles */}
      <path
        d="M27 7.5l1 1M29 10h1.5"
        stroke={strokeAccent}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
};

