import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const PolicyEngineIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Policy Engine",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeViolet = isColored ? "#A78BFA" : "#A3A3A3";
  const fillDeep = isColored ? "#4C1D95" : "#262626";
  const fillFoundation = isColored ? "#2E1065" : "#141414";
  const strokeAccent = isColored ? "#DDD6FE" : "#E5E5E5";
  const strokeGreen = isColored ? "#34D399" : "#C4C4C4";
  const strokeRed = isColored ? "#F87171" : "#8A8A8A";

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
      {/* Declarative Policy Engine Chassis */}
      <rect
        x="4"
        y="4"
        width="24"
        height="24"
        rx="3.5"
        fill={fillFoundation}
        stroke={strokeViolet}
        strokeWidth="1.5"
      />

      {/* Decision Tree Logic Rails */}
      {/* Input Condition Rail */}
      <line x1="8" y1="10" x2="13" y2="10" stroke={strokeAccent} strokeWidth="1.3" strokeLinecap="round" />
      <line x1="8" y1="16" x2="13" y2="16" stroke={strokeAccent} strokeWidth="1.3" strokeLinecap="round" />
      <line x1="8" y1="22" x2="13" y2="22" stroke={strokeAccent} strokeWidth="1.3" strokeLinecap="round" />

      {/* Rule Expression Connectors */}
      <path d="M13 10L17 14V18L13 22" stroke={strokeViolet} strokeWidth="1.2" strokeLinejoin="round" />

      {/* Central Rule Evaluation Node (OPA / Cedar Decision Engine Diamond) */}
      <polygon
        points="17,11 21.5,16 17,21 12.5,16"
        fill={fillDeep}
        stroke={strokeAccent}
        strokeWidth="1.3"
      />
      <circle cx="17" cy="16" r="1.2" fill={strokeAccent} />

      {/* Decision Output Branching (Allow / Deny Evaluation Terminals) */}
      {/* Permit Decision Line (Top Right) */}
      <path d="M21.5 14L25 11" stroke={strokeGreen} strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="25" cy="11" r="1.4" fill={strokeGreen} />

      {/* Deny Decision Line (Bottom Right) */}
      <path d="M21.5 18L25 21" stroke={strokeRed} strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="25" cy="21" r="1.4" fill={strokeRed} />

      {/* Policy Version Badge */}
      <line x1="10" y1="7" x2="15" y2="7" stroke={strokeViolet} strokeWidth="1.2" strokeLinecap="round" strokeDasharray="1.5 1.5" />
    </svg>
  );
};
