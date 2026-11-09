import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const Layer4LoadBalancerIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Layer 4 Load Balancer",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeHub = isColored ? "#60A5FA" : "#A3A3A3";
  const fillHub = isColored ? "#1E3A8A" : "#1A1A1A";
  const strokeFlow = isColored ? "#818CF8" : "#737373";
  const strokeSocket = isColored ? "#38BDF8" : "#525252";
  const fillSocket = isColored ? "#1E40AF" : "#262626";
  const fillAccent = isColored ? "#93C5FD" : "#D4D4D4";

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
      {/* Outer Transport Switch Frame */}
      <rect
        x="6"
        y="9"
        width="20"
        height="14"
        rx="2.5"
        fill={fillHub}
        stroke={strokeHub}
        strokeWidth="1.5"
      />

      {/* Transport Port Ingress (Top TCP/UDP Socket) */}
      <circle cx="16" cy="4" r="2" fill={fillSocket} stroke={strokeSocket} strokeWidth="1" />
      <path d="M16 6v3" stroke={strokeSocket} strokeWidth="1.5" strokeLinecap="round" />

      {/* Internal Transport Routing Matrix */}
      <path
        d="M11 13.5h10M11 18.5h10M16 11.5v9"
        stroke={strokeFlow}
        strokeWidth="1"
        strokeDasharray="2 2"
      />
      <circle cx="16" cy="16" r="1.5" fill={fillAccent} />

      {/* Transport Egress Ports (Bottom 3 Sockets) */}
      <path d="M10 23v4M16 23v5M22 23v4" stroke={strokeFlow} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="27.5" r="1.5" fill={fillSocket} stroke={strokeSocket} strokeWidth="1" />
      <circle cx="16" cy="28.5" r="1.5" fill={fillSocket} stroke={strokeSocket} strokeWidth="1" />
      <circle cx="22" cy="27.5" r="1.5" fill={fillSocket} stroke={strokeSocket} strokeWidth="1" />
    </svg>
  );
};

