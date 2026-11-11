import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const CliClientIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "CLI Client",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeWindow = isColored ? "#60A5FA" : "#D4D4D4";
  const fillTitleBar = isColored ? "#1D4ED8" : "#262626";
  const fillDot1 = isColored ? "#38BDF8" : "#FFFFFF";
  const fillDot2 = isColored ? "#60A5FA" : "#D4D4D4";
  const fillDot3 = isColored ? "#A78BFA" : "#A3A3A3";
  const strokePrompt = isColored ? "#38BDF8" : "#FFFFFF";
  const fillCursor = isColored ? "#60A5FA" : "#E5E5E5";
  const strokeOutput = isColored ? "#CBD5E1" : "#A3A3A3";

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
      {/* Terminal Window Box */}
      <rect
        x="3"
        y="5"
        width="26"
        height="22"
        rx="3"
        fill="#080808"
        stroke={strokeWindow}
        strokeWidth="1.5"
      />
      {/* Console Titlebar */}
      <path
        d="M3 8a3 3 0 0 1 3-3h20a3 3 0 0 1 3 3v2H3V8z"
        fill={fillTitleBar}
      />
      {/* Window Controls */}
      <circle cx="6.5" cy="7.5" r="0.8" fill={fillDot1} />
      <circle cx="9" cy="7.5" r="0.8" fill={fillDot2} />
      <circle cx="11.5" cy="7.5" r="0.8" fill={fillDot3} />

      {/* Terminal Prompt > */}
      <path
        d="M7 14l3.5 3.5L7 21"
        stroke={strokePrompt}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Blinking Cursor Block */}
      <rect x="13" y="19" width="4.5" height="2" rx="0.5" fill={fillCursor} />
      {/* Command Text Line */}
      <path
        d="M13 15h11"
        stroke={strokeOutput}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
};

