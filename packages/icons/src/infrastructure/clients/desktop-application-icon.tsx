import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const DesktopApplicationIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Desktop Application",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokePrimary = isColored ? "#2563EB" : "#A3A3A3";
  const strokeStand = isColored ? "#60A5FA" : "#737373";
  const fillTitleBar = isColored ? "#1E40AF" : "#262626";
  const fillDot = isColored ? "#38BDF8" : "#E5E5E5";
  const fillSidebar = isColored ? "#1E3A8A" : "#1A1A1A";
  const strokeLines = isColored ? "#60A5FA" : "#737373";

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
      {/* Desktop Screen Frame */}
      <rect
        x="3"
        y="4"
        width="26"
        height="18"
        rx="2.5"
        fill="#080808"
        stroke={strokePrimary}
        strokeWidth="1.5"
      />
      {/* Monitor Stand */}
      <path
        d="M13 22v4h6v-4"
        stroke={strokeStand}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Stand Base */}
      <path
        d="M10 26h12"
        stroke={strokeStand}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Native App Titlebar */}
      <rect x="4.5" y="5.5" width="23" height="3" rx="1" fill={fillTitleBar} />
      <circle cx="6.5" cy="7" r="0.75" fill={fillDot} />
      <circle cx="8.5" cy="7" r="0.75" fill={fillDot} />
      {/* App Panes */}
      <rect x="5" y="9.5" width="6" height="11" rx="1" fill={fillSidebar} />
      {/* Right Canvas Lines */}
      <path
        d="M13 12h11M13 15h8M13 18h10"
        stroke={strokeLines}
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
};
