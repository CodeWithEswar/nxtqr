import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const WebBrowserIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Web Browser",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokePrimary = isColored ? "#60A5FA" : "#D4D4D4";
  const fillTitleBar = isColored ? "#1D4ED8" : "#262626";
  const fillDot1 = isColored ? "#38BDF8" : "#FFFFFF";
  const fillDot2 = isColored ? "#60A5FA" : "#D4D4D4";
  const fillDot3 = isColored ? "#93C5FD" : "#A3A3A3";
  const fillAddress = isColored ? "#1E293B" : "#1A1A1A";
  const fillSidebar = isColored ? "#1E293B" : "#1F1F1F";
  const fillCard = isColored ? "#2563EB" : "#333333";
  const fillLine = isColored ? "#38BDF8" : "#A3A3A3";

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
      {/* Outer Browser Window */}
      <rect
        x="3"
        y="5"
        width="26"
        height="22"
        rx="3"
        fill="#080808"
        stroke={strokePrimary}
        strokeWidth="1.5"
      />
      {/* Title Bar */}
      <path
        d="M3 8a3 3 0 0 1 3-3h20a3 3 0 0 1 3 3v3H3V8z"
        fill={fillTitleBar}
      />
      {/* Window Controls */}
      <circle cx="6.5" cy="8" r="1" fill={fillDot1} />
      <circle cx="9.5" cy="8" r="1" fill={fillDot2} />
      <circle cx="12.5" cy="8" r="1" fill={fillDot3} />
      {/* Address Bar */}
      <rect x="15" y="6.5" width="11" height="3" rx="1.5" fill={fillAddress} />
      {/* Content Viewport Layout */}
      <rect x="5.5" y="13.5" width="5" height="11" rx="1" fill={fillSidebar} />
      <rect x="12.5" y="13.5" width="14" height="6" rx="1" fill={fillCard} />
      <rect x="12.5" y="21.5" width="9" height="1.75" rx="0.75" fill={fillLine} />
    </svg>
  );
};

