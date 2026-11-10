import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const GuardrailProxyIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Guardrail Proxy",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#EF4444" : "#A3A3A3";
  const strokeAccent = isColored ? "#F87171" : "#E5E5E5";
  const fillProxy = isColored ? "#450A0A" : "#141414";
  const fillShield = isColored ? "#7F1D1D" : "#262626";
  const accentSafe = isColored ? "#22C55E" : "#FFFFFF";

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
      {/* Outer Armor Shield */}
      <path
        d="M16 3L27 7V16C27 22.5 16 28 16 28C16 28 5 22.5 5 16V7L16 3Z"
        fill={fillProxy}
        stroke={strokeColor}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Inner Guardrail Filter Barrier */}
      <path
        d="M16 6.5L24 9.5V16C24 21 16 25 16 25C16 25 8 21 8 16V9.5L16 6.5Z"
        fill={fillShield}
        stroke={strokeAccent}
        strokeWidth="1"
        strokeLinejoin="round"
      />

      {/* Interception Cross-Bar / Wall */}
      <line x1="10" y1="14" x2="22" y2="14" stroke={strokeAccent} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="12" y1="18" x2="20" y2="18" stroke={strokeAccent} strokeWidth="1.2" strokeLinecap="round" />

      {/* Safety Verification Padlock / Check Icon */}
      <rect x="13.5" y="14" width="5" height="4" rx="1" fill={accentSafe} />
      <path d="M14.5 14V12.5C14.5 11.7 15.2 11 16 11C16.8 11 17.5 11.7 17.5 12.5V14" stroke={accentSafe} strokeWidth="1" />

      {/* Blocked Threat Arrows deflected at boundary */}
      <path d="M2 11L5 13M2 13L5 11" stroke={strokeColor} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M30 11L27 13M30 13L27 11" stroke={strokeColor} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
};
