import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const StorageGatewayIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Storage Gateway",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeViolet = isColored ? "#A78BFA" : "#A3A3A3";
  const fillDeep = isColored ? "#6D28D9" : "#262626";
  const fillFoundation = isColored ? "#2E1065" : "#141414";
  const strokeAccent = isColored ? "#EDE9FE" : "#E5E5E5";
  const fillBridge = isColored ? "#5B21B6" : "#1F1F1F";

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
      {/* Central Translation Gateway Housing / Core */}
      <rect
        x="10"
        y="5"
        width="12"
        height="22"
        rx="2"
        fill={fillFoundation}
        stroke={strokeViolet}
        strokeWidth="1.5"
      />

      {/* Gateway Engine Core Block */}
      <rect
        x="12"
        y="10"
        width="8"
        height="12"
        rx="1"
        fill={fillBridge}
        stroke={strokeAccent}
        strokeWidth="1.1"
      />

      {/* Internal Translation Sync Wave / Matrix */}
      <circle cx="16" cy="13.5" r="1.25" fill={strokeAccent} />
      <path
        d="M14 16.5H18M14 18.5H18"
        stroke={strokeViolet}
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Client-Facing Protocol Ingress (Left Side - NFS/SMB/iSCSI) */}
      <path
        d="M3 11H10M3 16H10M3 21H10"
        stroke={strokeViolet}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      {/* Left Ingress Terminal Pins */}
      <circle cx="3" cy="11" r="1" fill={strokeAccent} />
      <circle cx="3" cy="16" r="1" fill={strokeAccent} />
      <circle cx="3" cy="21" r="1" fill={strokeAccent} />

      {/* Cloud-Facing Storage Backend Egress (Right Side - REST / S3 / Blob) */}
      <path
        d="M22 13.5H29M22 18.5H29"
        stroke={strokeAccent}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      {/* Right Egress Arrow Heads */}
      <path
        d="M27 11.5L29 13.5L27 15.5"
        stroke={strokeAccent}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M27 16.5L29 18.5L27 20.5"
        stroke={strokeAccent}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Gateway Status Beacon (Top) */}
      <circle cx="16" cy="7.5" r="1.5" fill={fillDeep} stroke={strokeAccent} strokeWidth="0.8" />
    </svg>
  );
};
