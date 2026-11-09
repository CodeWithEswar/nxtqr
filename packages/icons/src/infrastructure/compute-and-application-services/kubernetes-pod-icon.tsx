import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const KubernetesPodIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Kubernetes Pod",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeIndigo = isColored ? "#818CF8" : "#A3A3A3";
  const fillPod = isColored ? "#1E1B4B" : "#1A1A1A";
  const strokeBox = isColored ? "#6366F1" : "#737373";
  const fillBox = isColored ? "#312E81" : "#262626";
  const strokeBridge = isColored ? "#A5B4FC" : "#525252";
  const fillAccent = isColored ? "#E0E7FF" : "#D4D4D4";

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
      {/* Outer Pod Capsule / Pod Boundary (Shared Network Namespace) */}
      <rect
        x="4.5"
        y="5.5"
        width="23"
        height="21"
        rx="5.5"
        fill={fillPod}
        stroke={strokeIndigo}
        strokeWidth="1.5"
      />

      {/* Two Internal Co-located Application Containers */}
      {/* Container 1 (Main Application) */}
      <rect
        x="7.5"
        y="9.5"
        width="7"
        height="13"
        rx="1.5"
        fill={fillBox}
        stroke={strokeBox}
        strokeWidth="1.2"
      />
      <circle cx="11" cy="13" r="1.25" fill={fillAccent} />
      <path d="M9.5 17h3" stroke={strokeBridge} strokeWidth="1" strokeLinecap="round" />

      {/* Container 2 (Sidecar Container) */}
      <rect
        x="17.5"
        y="9.5"
        width="7"
        height="13"
        rx="1.5"
        fill={fillBox}
        stroke={strokeBox}
        strokeWidth="1.2"
      />
      <circle cx="21" cy="13" r="1.25" fill={fillAccent} />
      <path d="M19.5 17h3" stroke={strokeBridge} strokeWidth="1" strokeLinecap="round" />

      {/* Localhost / In-Pod IPC Shared Network Bridge */}
      <path
        d="M14.5 16h3"
        stroke={strokeBridge}
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Top Pod IP Ingress Handle / Indicator */}
      <path d="M16 2v3.5" stroke={strokeIndigo} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="16" cy="2" r="1.25" fill={fillAccent} />
    </svg>
  );
};

