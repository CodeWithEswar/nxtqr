import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const EvaluationGatewayIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Evaluation Gateway",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#3B82F6" : "#A3A3A3";
  const strokeAccent = isColored ? "#60A5FA" : "#E5E5E5";
  const fillGateway = isColored ? "#172554" : "#141414";
  const fillDial = isColored ? "#1E3A8A" : "#262626";
  const accentPass = isColored ? "#10B981" : "#FFFFFF";

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
      {/* Outer Hexagonal Shield / Gateway Frame */}
      <polygon
        points="16,3 28,9 28,23 16,29 4,23 4,9"
        fill={fillGateway}
        stroke={strokeColor}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Internal Evaluation Benchmark Dial / Speedometer Arc */}
      <path
        d="M9 20C9 14.5 12.1 10 16 10C19.9 10 23 14.5 23 20"
        stroke={strokeAccent}
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Gauge Tick Marks */}
      <line x1="10" y1="18" x2="11.5" y2="17" stroke={strokeColor} strokeWidth="1" />
      <line x1="16" y1="10" x2="16" y2="12" stroke={accentPass} strokeWidth="1.2" />
      <line x1="22" y1="18" x2="20.5" y2="17" stroke={strokeColor} strokeWidth="1" />

      {/* Dial Needle / Measurement Indicator */}
      <line x1="16" y1="20" x2="18" y2="13" stroke={accentPass} strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="16" cy="20" r="2.2" fill={fillDial} stroke={strokeColor} strokeWidth="1" />

      {/* Quality Check / Passing Target Badge (Bottom) */}
      <path d="M13 24.5L15 26.5L19 22.5" stroke={accentPass} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

