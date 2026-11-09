import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const WebServerIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Web Server",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeChassis = isColored ? "#60A5FA" : "#A3A3A3";
  const fillChassis = isColored ? "#1E3A8A" : "#1A1A1A";
  const strokeAccent = isColored ? "#93C5FD" : "#D4D4D4";
  const fillAccent = isColored ? "#3B82F6" : "#404040";
  const fillLed = isColored ? "#60A5FA" : "#737373";
  const fillLedActive = isColored ? "#93C5FD" : "#D4D4D4";
  const strokePath = isColored ? "#38BDF8" : "#737373";

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
      {/* Top HTTP / Web Request Ingress Symbol */}
      <path
        d="M16 2.5v5M12.5 5.5l3.5-3 3.5 3"
        stroke={strokePath}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Main Server Chassis */}
      <rect
        x="4"
        y="9.5"
        width="24"
        height="14"
        rx="2.5"
        fill={fillChassis}
        stroke={strokeChassis}
        strokeWidth="1.5"
      />

      {/* Rack Ventilation Grille / Bay Slot */}
      <rect
        x="7.5"
        y="12.5"
        width="11"
        height="8"
        rx="1.5"
        fill={fillAccent}
        opacity={isColored ? "0.3" : "0.5"}
      />
      <path
        d="M10 14.5h6M10 16.5h6M10 18.5h6"
        stroke={strokeAccent}
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Front LEDs & Activity Status */}
      <circle cx="22" cy="14" r="1.5" fill={fillLedActive} />
      <circle cx="22" cy="18.5" r="1.5" fill={fillLed} />

      {/* Bottom Response Egress Ports */}
      <path
        d="M9 25.5v3M16 25.5v3M23 25.5v3"
        stroke={strokePath}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
};
