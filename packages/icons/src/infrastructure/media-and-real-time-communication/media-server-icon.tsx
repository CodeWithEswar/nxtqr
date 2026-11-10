import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const MediaServerIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Media Server",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#60A5FA" : "#A3A3A3";
  const strokeAccent = isColored ? "#93C5FD" : "#D4D4D4";
  const fillFoundation = isColored ? "#172554" : "#141414";
  const fillSurface = isColored ? "#1E3A8A" : "#1F1F1F";

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
      {/* Media Processing Outer Chassis */}
      <rect
        x="4"
        y="5"
        width="24"
        height="22"
        rx="3"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.3"
      />

      {/* Internal Routing Screen / Matrix Display */}
      <rect
        x="7"
        y="8"
        width="18"
        height="10"
        rx="1.5"
        fill={fillSurface}
        stroke={strokeAccent}
        strokeWidth="0.8"
      />

      {/* Audio / Video Track Waveform Lines (SFU Mixer Representation) */}
      <path
        d="M9 13H11V16H9V13ZM12 11H14V17H12V11ZM15 10H17V18H15V10ZM18 12H20V16H18V12ZM21 14H23V15H21V14Z"
        fill={strokeAccent}
      />

      {/* Media Output Relay Ports (Multi-cast Egress) */}
      <circle cx="8" cy="22.5" r="1.5" fill={isColored ? "#60A5FA" : "#A3A3A3"} />
      <circle cx="13.3" cy="22.5" r="1.5" fill={isColored ? "#60A5FA" : "#A3A3A3"} />
      <circle cx="18.6" cy="22.5" r="1.5" fill={isColored ? "#60A5FA" : "#A3A3A3"} />
      <circle cx="24" cy="22.5" r="1.5" fill={isColored ? "#34D399" : "#D4D4D4"} />

      {/* Media Feed Indicators */}
      <path
        d="M16 2V5M12 3L13 5M20 3L19 5"
        stroke={strokeColor}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
};

