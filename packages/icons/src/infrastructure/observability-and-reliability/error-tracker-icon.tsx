import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const ErrorTrackerIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Error Tracker",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeLavender = isColored ? "#C4B5FD" : "#A3A3A3";
  const fillFoundation = isColored ? "#3B0764" : "#141414";
  const strokeAccent = isColored ? "#E9D5FF" : "#E5E5E5";
  const fillBug = isColored ? "#7E22CE" : "#1F1F1F";
  const strokeRed = isColored ? "#F87171" : "#D4D4D4";

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
      {/* Exception Tracking Vault / Frame */}
      <rect
        x="4"
        y="4"
        width="24"
        height="24"
        rx="3.5"
        fill={fillFoundation}
        stroke={strokeLavender}
        strokeWidth="1.5"
      />

      {/* Stack Trace Grouping Perimeter Ring */}
      <circle cx="16" cy="16" r="9" stroke={strokeLavender} strokeWidth="1.1" strokeDasharray="3 2" />

      {/* Exception Bug Silhouette (Head, Thorax, Antennas) */}
      <ellipse cx="16" cy="17" rx="4.5" ry="5.5" fill={fillBug} stroke={strokeAccent} strokeWidth="1.3" />
      <path d="M13.5 12C13.5 10.5 14.5 9.5 16 9.5C17.5 9.5 18.5 10.5 18.5 12" stroke={strokeAccent} strokeWidth="1.3" strokeLinecap="round" />

      {/* Bug Antennas */}
      <path d="M14 9.5L11.5 7" stroke={strokeAccent} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M18 9.5L20.5 7" stroke={strokeAccent} strokeWidth="1.2" strokeLinecap="round" />

      {/* Diagnostic Cross Exception Symbol */}
      <line x1="14.5" y1="15.5" x2="17.5" y2="18.5" stroke={strokeRed} strokeWidth="1.4" strokeLinecap="round" />
      <line x1="17.5" y1="15.5" x2="14.5" y2="18.5" stroke={strokeRed} strokeWidth="1.4" strokeLinecap="round" />

      {/* Stack Trace Level Guideline Hashes */}
      <line x1="7" y1="17" x2="11.5" y2="17" stroke={strokeLavender} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="20.5" y1="17" x2="25" y2="17" stroke={strokeLavender} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
};

