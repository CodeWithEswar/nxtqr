import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const ServerlessFunctionIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Serverless Function",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeAmber = isColored ? "#FBBF24" : "#A3A3A3";
  const fillFoundation = isColored ? "#451A03" : "#1A1A1A";
  const strokeOrange = isColored ? "#F59E0B" : "#737373";
  const fillFlash = isColored ? "#FEF08A" : "#D4D4D4";
  const strokeTrigger = isColored ? "#FDE68A" : "#A3A3A3";

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
      {/* Event Ingress Trigger Ray */}
      <path
        d="M6 5l6 6M4 8l5 5"
        stroke={strokeTrigger}
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Ephemeral Compute Execution Boundary */}
      <rect
        x="9.5"
        y="9.5"
        width="17"
        height="17"
        rx="3"
        fill={fillFoundation}
        stroke={strokeAmber}
        strokeWidth="1.5"
      />

      {/* Internal Function Execution Symbol: Mathematical f(x) curve & lightning pulse */}
      <path
        d="M19 13.5c-1 0-1.8.6-2 1.8l-1 5.4c-.2 1.2-1 1.8-2 1.8"
        stroke={strokeOrange}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M13.5 17h5" stroke={strokeAmber} strokeWidth="1.5" strokeLinecap="round" />

      {/* Event Spark / Ephemeral Trigger Indicator */}
      <polygon
        points="22.5,4.5 19.5,9.5 22.5,9.5 20.5,14.5 25.5,8.5 22.5,8.5"
        fill={fillFlash}
      />
    </svg>
  );
};
