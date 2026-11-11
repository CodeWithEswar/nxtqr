import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const SinglePageApplicationIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Single Page Application",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokePrimary = isColored ? "#60A5FA" : "#D4D4D4";
  const fillTitleBar = isColored ? "#1D4ED8" : "#262626";
  const strokeLoop = isColored ? "#38BDF8" : "#E5E5E5";
  const fillBlock1 = isColored ? "#60A5FA" : "#D4D4D4";
  const fillBlock2 = isColored ? "#A78BFA" : "#A3A3A3";
  const fillBlock3 = isColored ? "#38BDF8" : "#737373";

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
      {/* Application Frame */}
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
      {/* Top Bar */}
      <path
        d="M3 8a3 3 0 0 1 3-3h20a3 3 0 0 1 3 3v2H3V8z"
        fill={fillTitleBar}
      />
      {/* SPA Reactive State Loop */}
      <path
        d="M19 12.5a4 4 0 1 0-3 3.8"
        stroke={strokeLoop}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M19.5 10.5v3h-3" stroke={strokeLoop} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dynamic Component Blocks */}
      <rect x="5.5" y="19" width="5.5" height="5" rx="1" fill={fillBlock1} />
      <rect x="13.25" y="19" width="5.5" height="5" rx="1" fill={fillBlock2} />
      <rect x="21" y="19" width="5.5" height="5" rx="1" fill={fillBlock3} />
    </svg>
  );
};

