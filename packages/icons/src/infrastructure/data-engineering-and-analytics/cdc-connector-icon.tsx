import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const CdcConnectorIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "CDC Connector",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#FB923C" : "#A3A3A3";
  const strokeAccent = isColored ? "#FDBA74" : "#E5E5E5";
  const fillFoundation = isColored ? "#431407" : "#141414";
  const fillSensor = isColored ? "#7C2D12" : "#262626";

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
      {/* 1. Source Database Cylinder */}
      <path
        d="M4 10C4 8.6 6.5 7.5 9.5 7.5C12.5 7.5 15 8.6 15 10V22C15 23.4 12.5 24.5 9.5 24.5C6.5 24.5 4 23.4 4 22V10Z"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.2"
      />
      <ellipse cx="9.5" cy="10" rx="5.5" ry="2.2" fill={fillSensor} stroke={strokeColor} strokeWidth="1.2" />
      <path d="M4 15C4 16.2 6.5 17.2 9.5 17.2C12.5 17.2 15 16.2 15 15" stroke={strokeColor} strokeWidth="1.1" />

      {/* 2. Transaction Log / WAL Tap & Delta Change Sensor */}
      <path
        d="M15 15H18.5L20.5 12H24"
        stroke={strokeAccent}
        strokeWidth="1.4"
        strokeLinecap="round"
      />

      {/* Optical Delta Sensor Badge */}
      <circle cx="18.5" cy="15" r="3.5" fill={fillSensor} stroke={strokeColor} strokeWidth="1.2" />
      {/* Delta Symbol Δ inside sensor */}
      <path
        d="M18.5 13L20.5 16.5H16.5L18.5 13Z"
        fill={strokeAccent}
      />

      {/* 3. Real-Time Change-Event Stream Packets (Kafka/EventStream bound) */}
      <rect x="23" y="10" width="5" height="4" rx="1" fill={fillFoundation} stroke={strokeColor} strokeWidth="1.1" />
      <circle cx="25.5" cy="12" r="1" fill={strokeAccent} />

      <rect x="23" y="16" width="5" height="4" rx="1" fill={fillFoundation} stroke={strokeColor} strokeWidth="1.1" />
      <circle cx="25.5" cy="18" r="1" fill={strokeAccent} />

      {/* Stream emission pulses */}
      <path d="M28.5 12H30.5M28.5 18H30.5" stroke={strokeAccent} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
};

