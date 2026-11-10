import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const ManagedQueueIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Managed Queue",
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
      {/* Managed Queue Conduit Pipe Track */}
      <rect
        x="3.5"
        y="9"
        width="25"
        height="14"
        rx="3"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.3"
      />

      {/* Sequential Message Units (FIFO Order) */}
      {/* Message 1 (Head / Next to Consume) */}
      <rect
        x="20.5"
        y="11.5"
        width="5"
        height="9"
        rx="1"
        fill={fillSurface}
        stroke={strokeAccent}
        strokeWidth="1.1"
      />
      <line x1="22" y1="14" x2="24" y2="14" stroke={strokeAccent} strokeWidth="0.8" />
      <line x1="22" y1="16.5" x2="24" y2="16.5" stroke={strokeAccent} strokeWidth="0.8" />

      {/* Message 2 (In Transit) */}
      <rect
        x="13.5"
        y="11.5"
        width="5"
        height="9"
        rx="1"
        fill={fillSurface}
        stroke={strokeAccent}
        strokeWidth="1.1"
      />
      <line x1="15" y1="14" x2="17" y2="14" stroke={strokeAccent} strokeWidth="0.8" />
      <line x1="15" y1="16.5" x2="17" y2="16.5" stroke={strokeAccent} strokeWidth="0.8" />

      {/* Message 3 (Tail / Newly Ingested) */}
      <rect
        x="6.5"
        y="11.5"
        width="5"
        height="9"
        rx="1"
        fill={fillSurface}
        stroke={strokeColor}
        strokeWidth="1.1"
      />

      {/* Ingress / Producer Arrow Guide (Top Left) */}
      <path
        d="M5 6.5H10M10 6.5L8 4.5M10 6.5L8 8.5"
        stroke={strokeAccent}
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Egress / Consumer Arrow Guide (Bottom Right) */}
      <path
        d="M22 25.5H27M27 25.5L25 23.5M27 25.5L25 27.5"
        stroke={strokeAccent}
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

