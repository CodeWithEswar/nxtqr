import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const Layer7LoadBalancerIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Layer 7 Load Balancer",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeHub = isColored ? "#818CF8" : "#A3A3A3";
  const fillHub = isColored ? "#312E81" : "#1A1A1A";
  const strokePath = isColored ? "#A78BFA" : "#737373";
  const strokeBranch = isColored ? "#38BDF8" : "#525252";
  const fillAccent = isColored ? "#C7D2FE" : "#D4D4D4";
  const fillBadge = isColored ? "#1E1B4B" : "#262626";

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
      {/* Application Router Core */}
      <rect
        x="6"
        y="8"
        width="20"
        height="14"
        rx="2.5"
        fill={fillHub}
        stroke={strokeHub}
        strokeWidth="1.5"
      />

      {/* HTTP / Application Path Symbol in Core */}
      <rect x="9.5" y="11" width="13" height="4" rx="1.5" fill={fillBadge} stroke={strokePath} strokeWidth="1" />
      <path d="M12 13h4M18 13h1.5" stroke={fillAccent} strokeWidth="1" strokeLinecap="round" />

      {/* Path Dispatcher Switch Point */}
      <circle cx="16" cy="18.5" r="1.5" fill={fillAccent} />

      {/* Ingress Request Arrow (Top) */}
      <path d="M16 2.5v3.5M14 5l2 1.5 2-1.5" stroke={strokePath} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Application Routing Egress Branches */}
      <path
        d="M16 22v6M12 22l-4 5M20 22l4 5"
        stroke={strokeBranch}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="7.5" cy="27.5" r="1.5" fill={strokeBranch} />
      <circle cx="16" cy="28.5" r="1.5" fill={strokeBranch} />
      <circle cx="24.5" cy="27.5" r="1.5" fill={strokeBranch} />
    </svg>
  );
};

