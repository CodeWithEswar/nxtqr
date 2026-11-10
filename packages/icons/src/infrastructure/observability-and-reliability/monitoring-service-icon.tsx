import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const MonitoringServiceIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Monitoring Service",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeCyan = isColored ? "#38BDF8" : "#A3A3A3";
  const fillDeep = isColored ? "#0C4A6E" : "#262626";
  const fillFoundation = isColored ? "#082F49" : "#141414";
  const strokeAccent = isColored ? "#BAE6FD" : "#E5E5E5";
  const strokeGreen = isColored ? "#34D399" : "#D4D4D4";

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
      {/* Monitoring Console Outer Display Screen */}
      <rect
        x="3.5"
        y="4"
        width="25"
        height="24"
        rx="3.5"
        fill={fillFoundation}
        stroke={strokeCyan}
        strokeWidth="1.5"
      />

      {/* Screen Bezel & Sensor Array Top Bar */}
      <line x1="3.5" y1="10" x2="28.5" y2="10" stroke={strokeCyan} strokeWidth="1.1" />
      <circle cx="7" cy="7" r="1.1" fill={strokeGreen} />
      <circle cx="10.5" cy="7" r="1.1" fill={strokeAccent} />
      <line x1="14" y1="7" x2="20" y2="7" stroke={strokeAccent} strokeWidth="1.1" strokeLinecap="round" />

      {/* Primary Infrastructure Waveform Oscilloscope */}
      <path
        d="M5.5 19.5H10L12.5 14L15.5 23L18.5 16.5L20.5 19.5H26.5"
        stroke={strokeCyan}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Heartbeat Target Sensor Nodes */}
      <circle cx="12.5" cy="14" r="1.2" fill={fillDeep} stroke={strokeAccent} strokeWidth="1" />
      <circle cx="15.5" cy="23" r="1.2" fill={fillDeep} stroke={strokeAccent} strokeWidth="1" />
      <circle cx="18.5" cy="16.5" r="1.2" fill={fillDeep} stroke={strokeAccent} strokeWidth="1" />

      {/* Real-time Sampling Grid Baseline */}
      <line x1="6" y1="25" x2="26" y2="25" stroke={strokeCyan} strokeWidth="1.1" strokeDasharray="2 2" />
    </svg>
  );
};

