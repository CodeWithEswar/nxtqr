import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const ForwardProxyIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Forward Proxy",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeProxy = isColored ? "#2DD4BF" : "#A3A3A3";
  const fillProxy = isColored ? "#134E4A" : "#1A1A1A";
  const strokePath = isColored ? "#60A5FA" : "#737373";
  const strokeClient = isColored ? "#38BDF8" : "#525252";
  const fillClient = isColored ? "#0C4A6E" : "#262626";
  const fillAccent = isColored ? "#99F6E4" : "#D4D4D4";

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
      {/* Internal Client Node (Left) */}
      <rect x="3.5" y="11" width="6" height="10" rx="1.5" fill={fillClient} stroke={strokeClient} strokeWidth="1.2" />
      <path d="M5.5 18.5h2" stroke={strokeClient} strokeWidth="1" strokeLinecap="round" />

      {/* Outbound Arrow to Proxy */}
      <path d="M9.5 16h3.5M11.5 14.5l1.5 1.5-1.5 1.5" stroke={strokePath} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Intermediate Forward Proxy (Center) */}
      <rect
        x="13.5"
        y="8"
        width="9"
        height="16"
        rx="2"
        fill={fillProxy}
        stroke={strokeProxy}
        strokeWidth="1.5"
      />
      <circle cx="18" cy="13" r="1.5" fill={fillAccent} />
      <path d="M16 17h4M16 19.5h2.5" stroke={fillAccent} strokeWidth="1" strokeLinecap="round" />

      {/* Outbound Egress Arrow to Public Internet (Right) */}
      <path d="M22.5 16h4M25 14.5l1.5 1.5-1.5 1.5" stroke={strokeProxy} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* External Destination Node (Right Edge) */}
      <circle cx="28.5" cy="16" r="1.5" fill={strokeProxy} />
    </svg>
  );
};
