import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const CircuitBreakerIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Circuit Breaker",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeBoundary = isColored ? "#F87171" : "#A3A3A3";
  const strokeAccent = isColored ? "#FECACA" : "#D4D4D4";
  const fillFoundation = isColored ? "#450A0A" : "#141414";
  const fillSurface = isColored ? "#7F1D1D" : "#1F1F1F";
  const breakerColor = isColored ? "#F87171" : "#E5E5E5";

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
      {/* Outer Enclosure Frame */}
      <rect
        x="3"
        y="4"
        width="26"
        height="24"
        rx="4"
        fill={fillFoundation}
        stroke={strokeBoundary}
        strokeWidth="1.2"
      />

      {/* Internal Protected Circuit Channel */}
      <rect
        x="6"
        y="7"
        width="20"
        height="18"
        rx="2.5"
        fill={fillSurface}
        stroke={strokeBoundary}
        strokeWidth="1"
      />

      {/* Incoming Request Lead Line */}
      <path
        d="M8 16H12"
        stroke={strokeAccent}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="12" cy="16" r="1.5" fill={strokeAccent} />

      {/* Outgoing Downstream Lead Line */}
      <circle cx="20" cy="16" r="1.5" fill={strokeAccent} />
      <path
        d="M20 16H24"
        stroke={strokeAccent}
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Switch Blade Mechanism (Angled indicating circuit breaker trip / trip boundary) */}
      <path
        d="M12 16L18 10.5"
        stroke={breakerColor}
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* Trip / Warning Pulse Sparks */}
      <path
        d="M19 9L21 7M16 8L15 6"
        stroke={strokeAccent}
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Reset / Probe Indicator Arc */}
      <path
        d="M11 21C13 22.5 19 22.5 21 21"
        stroke={breakerColor}
        strokeWidth="1.2"
        strokeDasharray="1.5 1.5"
        strokeLinecap="round"
      />
    </svg>
  );
};

CircuitBreakerIcon.displayName = "CircuitBreakerIcon";

