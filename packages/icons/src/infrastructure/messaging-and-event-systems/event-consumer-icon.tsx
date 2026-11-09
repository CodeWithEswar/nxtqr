import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const EventConsumerIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Event Consumer",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeGreen = isColored ? "#34D399" : "#A3A3A3";
  const fillWorker = isColored ? "#064E3B" : "#1A1A1A";
  const strokeAccent = isColored ? "#A7F3D0" : "#E5E5E5";
  const fillMessage = isColored ? "#065F46" : "#262626";

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
      {/* Consumer Worker Engine Enclosure */}
      <rect
        x="13"
        y="6"
        width="16"
        height="20"
        rx="3"
        fill={fillWorker}
        stroke={strokeGreen}
        strokeWidth="1.5"
      />

      {/* Internal Worker Processing Cores / Concurrency Slots */}
      <rect
        x="16"
        y="9.5"
        width="10"
        height="4"
        rx="1"
        fill={fillMessage}
        stroke={strokeAccent}
        strokeWidth="1.1"
      />
      <rect
        x="16"
        y="15.5"
        width="10"
        height="4"
        rx="1"
        fill={fillMessage}
        stroke={strokeGreen}
        strokeWidth="1.1"
      />

      {/* Acknowledgment Pulse Indicator (Checkmark) */}
      <path
        d="M17 22.5l2 2 4.5-4"
        stroke={strokeAccent}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Inbound Arriving Event Envelope (Left to Right) */}
      <rect
        x="3"
        y="12"
        width="7"
        height="8"
        rx="1.5"
        fill={fillMessage}
        stroke={strokeGreen}
        strokeWidth="1.2"
      />
      {/* Event Envelope Fold Lines */}
      <path
        d="M3 13.5l3.5 2.5 3.5-2.5"
        stroke={strokeAccent}
        strokeWidth="1"
        strokeLinejoin="round"
      />

      {/* Ingestion Velocity Arrow into Worker Port */}
      <path
        d="M10 16h3M11.5 14.5L13 16l-1.5 1.5"
        stroke={strokeAccent}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

