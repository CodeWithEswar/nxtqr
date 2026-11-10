import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const GrpcServiceIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "gRPC Service",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#60A5FA" : "#A3A3A3";
  const strokeAccent = isColored ? "#BFDBFE" : "#D4D4D4";
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
      {/* Outer External Channel Boundary */}
      <rect
        x="3"
        y="5"
        width="26"
        height="22"
        rx="3.5"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.2"
        strokeDasharray="2.5 1.5"
      />

      {/* Left Service Endpoint (Caller) */}
      <rect
        x="6"
        y="9"
        width="6.5"
        height="14"
        rx="2"
        fill={fillSurface}
        stroke={strokeColor}
        strokeWidth="1.1"
      />
      <circle cx="9.25" cy="13" r="1.2" fill={strokeAccent} />
      <line x1="8" y1="18" x2="10.5" y2="18" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" />

      {/* Right Service Endpoint (gRPC Host) */}
      <rect
        x="19.5"
        y="9"
        width="6.5"
        height="14"
        rx="2"
        fill={fillSurface}
        stroke={strokeColor}
        strokeWidth="1.1"
      />
      <circle cx="22.75" cy="13" r="1.2" fill={strokeAccent} />
      <line x1="21.5" y1="18" x2="24" y2="18" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" />

      {/* Central Protobuf / HTTP2 Multiplexed Binary Stream Channels */}
      <path
        d="M12.5 13H19.5M19.5 13L17.5 11.5M19.5 13L17.5 14.5"
        stroke={strokeAccent}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.5 19H12.5M12.5 19L14.5 17.5M12.5 19L14.5 20.5"
        stroke={strokeColor}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Central Contract / IDL Schema Diamond Indicator */}
      <polygon
        points="16,14.5 17.5,16 16,17.5 14.5,16"
        fill={fillSurface}
        stroke={strokeAccent}
        strokeWidth="1"
      />
    </svg>
  );
};

GrpcServiceIcon.displayName = "GrpcServiceIcon";

