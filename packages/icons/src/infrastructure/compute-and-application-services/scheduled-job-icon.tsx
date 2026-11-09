import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const ScheduledJobIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Scheduled Job",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeAmber = isColored ? "#FBBF24" : "#A3A3A3";
  const fillClock = isColored ? "#451A03" : "#1A1A1A";
  const strokeOrange = isColored ? "#F59E0B" : "#737373";
  const fillTask = isColored ? "#78350F" : "#262626";
  const fillHand = isColored ? "#FEF08A" : "#D4D4D4";
  const strokeTrigger = isColored ? "#FDE68A" : "#525252";

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
      {/* Precision Schedule Clock Face (Left-Upper) */}
      <circle
        cx="13"
        cy="13"
        r="8.5"
        fill={fillClock}
        stroke={strokeAmber}
        strokeWidth="1.5"
      />
      {/* Clock Hands indicating scheduled interval (12:15) */}
      <path
        d="M13 8.5v4.5l3.5 2"
        stroke={fillHand}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="13" cy="13" r="1.2" fill={fillHand} />

      {/* Dynamic Trigger Tick Path radiating to execution unit */}
      <path
        d="M18.5 18.5l2 2"
        stroke={strokeTrigger}
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Scheduled Task Execution Enclosure (Right-Lower) */}
      <rect
        x="16.5"
        y="16.5"
        width="11"
        height="11"
        rx="2"
        fill={fillTask}
        stroke={strokeOrange}
        strokeWidth="1.5"
      />

      {/* Task Execution Checkmark / Run Glyph */}
      <path
        d="M19.5 22l2 2 4-4"
        stroke={fillHand}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Recurrence Indicator Ticks around Clock */}
      <circle cx="13" cy="2.5" r="1" fill={strokeTrigger} />
      <circle cx="2.5" cy="13" r="1" fill={strokeTrigger} />
    </svg>
  );
};

