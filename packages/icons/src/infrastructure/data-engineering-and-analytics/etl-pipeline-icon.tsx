import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const EtlPipelineIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "ETL Pipeline",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#38BDF8" : "#A3A3A3";
  const strokeAccent = isColored ? "#7DD3FC" : "#E5E5E5";
  const fillFoundation = isColored ? "#082F49" : "#141414";
  const fillTransform = isColored ? "#0369A1" : "#262626";

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
      {/* 1. Extract Stage: Source Cylinder */}
      <path
        d="M4 11C4 9.9 5.8 9 8 9C10.2 9 12 9.9 12 11V21C12 22.1 10.2 23 8 23C5.8 23 4 22.1 4 21V11Z"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.2"
      />
      <ellipse cx="8" cy="11" rx="4" ry="2" fill={fillTransform} stroke={strokeColor} strokeWidth="1.2" />
      <path d="M4 16C4 17.1 5.8 18 8 18C10.2 18 12 17.1 12 16" stroke={strokeColor} strokeWidth="1.2" />

      {/* Extract -> Transform Arrow */}
      <path d="M12.5 16H15" stroke={strokeAccent} strokeWidth="1.4" strokeLinecap="round" />

      {/* 2. Transform Stage: Processing Diamond with Cog/Filter facets */}
      <rect
        x="15"
        y="12"
        width="8"
        height="8"
        rx="1.5"
        transform="rotate(45 19 16)"
        fill={fillTransform}
        stroke={strokeColor}
        strokeWidth="1.3"
      />
      {/* Inner transformation symbol (filter lines) */}
      <line x1="17" y1="15" x2="21" y2="15" stroke={strokeAccent} strokeWidth="1.1" strokeLinecap="round" />
      <line x1="18" y1="17" x2="20" y2="17" stroke={strokeAccent} strokeWidth="1.1" strokeLinecap="round" />

      {/* Transform -> Load Arrow */}
      <path d="M23 16H25.5" stroke={strokeAccent} strokeWidth="1.4" strokeLinecap="round" />

      {/* 3. Load Stage: Destination Storage Cylinder */}
      <path
        d="M26 12C26 11 27.3 10.2 29 10.2C30.7 10.2 32 11 32 12V20C32 21 30.7 21.8 29 21.8C27.3 21.8 26 21 26 20V12Z"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.2"
      />
      <ellipse cx="29" cy="12" rx="3" ry="1.6" fill={fillTransform} stroke={strokeColor} strokeWidth="1.2" />
      <path d="M26 16C26 17 27.3 17.6 29 17.6C30.7 17.6 32 17 32 16" stroke={strokeColor} strokeWidth="1.2" />
    </svg>
  );
};

