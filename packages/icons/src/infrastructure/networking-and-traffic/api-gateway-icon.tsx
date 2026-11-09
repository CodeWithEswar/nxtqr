import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const ApiGatewayIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "API Gateway",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeGate = isColored ? "#A78BFA" : "#A3A3A3";
  const fillGate = isColored ? "#2E1065" : "#1A1A1A";
  const strokePath = isColored ? "#818CF8" : "#737373";
  const strokeService = isColored ? "#60A5FA" : "#525252";
  const fillService = isColored ? "#1E3A8A" : "#262626";
  const fillKey = isColored ? "#DDD6FE" : "#D4D4D4";

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
      {/* Outer Gateway Portal Arch */}
      <path
        d="M8 22V11a8 8 0 0 1 16 0v11"
        stroke={strokeGate}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <rect
        x="10.5"
        y="12"
        width="11"
        height="10"
        rx="2"
        fill={fillGate}
        stroke={strokePath}
        strokeWidth="1"
      />

      {/* API Key / Token Authentication Symbol in Center */}
      <circle cx="16" cy="15.5" r="1.5" fill={fillKey} />
      <path d="M16 17v3M15 19h2" stroke={fillKey} strokeWidth="1" strokeLinecap="round" />

      {/* Top Client Inbound Arrow */}
      <path d="M16 2v4.5M14 4.5l2 2 2-2" stroke={strokeGate} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Backend Upstream Service Hand-offs */}
      <path
        d="M12 22v5M16 22v6M20 22v5"
        stroke={strokeService}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="12" cy="27.5" r="1.5" fill={fillService} stroke={strokeService} strokeWidth="1" />
      <circle cx="16" cy="28.5" r="1.5" fill={fillService} stroke={strokeService} strokeWidth="1" />
      <circle cx="20" cy="27.5" r="1.5" fill={fillService} stroke={strokeService} strokeWidth="1" />
    </svg>
  );
};

