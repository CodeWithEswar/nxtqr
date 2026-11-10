import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const SecretsInjectionServiceIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Secrets Injection Service",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#F87171" : "#A3A3A3";
  const strokeAccent = isColored ? "#FECACA" : "#D4D4D4";
  const fillFoundation = isColored ? "#450A0A" : "#141414";
  const fillSurface = isColored ? "#7F1D1D" : "#1F1F1F";

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
      {/* Protected Workload Boundary (Right Container) */}
      <rect
        x="13"
        y="5"
        width="15"
        height="22"
        rx="3"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.3"
      />
      {/* Internal Workload Process Slots */}
      <rect x="16" y="8" width="9" height="3" rx="0.8" fill={fillSurface} stroke={strokeColor} strokeWidth="0.8" />
      <rect x="16" y="13" width="9" height="3" rx="0.8" fill={fillSurface} stroke={strokeColor} strokeWidth="0.8" />
      <rect x="16" y="18" width="9" height="3" rx="0.8" fill={fillSurface} stroke={strokeColor} strokeWidth="0.8" />

      {/* Sidecar Injection Boundary Shield (Left / Overlap) */}
      <path
        d="M7 6L14 9V17C14 21.5 7 26 7 26C7 26 0 21.5 0 17V9L7 6Z"
        fill={fillSurface}
        stroke={strokeColor}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Cryptographic Key Symbol Injected into Workload */}
      <circle cx="7" cy="14" r="2.5" fill={strokeFoundation(isColored)} stroke={strokeAccent} strokeWidth="1" />
      <path
        d="M9.5 14H16M13.5 14V16.5M15.5 14V16"
        stroke={strokeAccent}
        strokeWidth="1.1"
        strokeLinecap="round"
      />

      {/* Secure Injection Ray Indicator */}
      <circle cx="21" cy="23" r="1.5" fill={isColored ? "#34D399" : "#D4D4D4"} />
    </svg>
  );
};

function strokeFoundation(isColored: boolean): string {
  return isColored ? "#450A0A" : "#141414";
}

