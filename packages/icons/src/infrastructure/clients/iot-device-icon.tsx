import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const IotDeviceIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "IoT Device",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeChip = isColored ? "#2563EB" : "#A3A3A3";
  const strokePins = isColored ? "#60A5FA" : "#737373";
  const fillSilicon = isColored ? "#1E3A8A" : "#262626";
  const strokeSilicon = isColored ? "#38BDF8" : "#A3A3A3";
  const fillCore = isColored ? "#A78BFA" : "#E5E5E5";
  const fillDot = isColored ? "#38BDF8" : "#737373";

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
      {/* External Microcontroller Pins */}
      {/* Top Pins */}
      <path d="M11 3v4M16 3v4M21 3v4" stroke={strokePins} strokeWidth="1.25" strokeLinecap="round" />
      {/* Bottom Pins */}
      <path d="M11 25v4M16 25v4M21 25v4" stroke={strokePins} strokeWidth="1.25" strokeLinecap="round" />
      {/* Left Pins */}
      <path d="M3 11h4M3 16h4M3 21h4" stroke={strokePins} strokeWidth="1.25" strokeLinecap="round" />
      {/* Right Pins */}
      <path d="M25 11h4M25 16h4M25 21h4" stroke={strokePins} strokeWidth="1.25" strokeLinecap="round" />

      {/* Main SoC Board Chassis */}
      <rect
        x="7"
        y="7"
        width="18"
        height="18"
        rx="2.5"
        fill="#080808"
        stroke={strokeChip}
        strokeWidth="1.5"
      />

      {/* Embedded Processor Die */}
      <rect
        x="11"
        y="11"
        width="10"
        height="10"
        rx="1.5"
        fill={fillSilicon}
        stroke={strokeSilicon}
        strokeWidth="1"
      />

      {/* Central Sensor/Telemetry Node */}
      <circle cx="16" cy="16" r="2" fill={fillCore} />
      <circle cx="9.5" cy="9.5" r="0.75" fill={fillDot} />
    </svg>
  );
};

