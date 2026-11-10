import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const AlertManagerIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Alert Manager",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeRed = isColored ? "#F87171" : "#A3A3A3";
  const fillDeep = isColored ? "#7F1D1D" : "#262626";
  const fillFoundation = isColored ? "#450A0A" : "#141414";
  const strokeAccent = isColored ? "#FECACA" : "#E5E5E5";
  const fillPlate = isColored ? "#991B1B" : "#1F1F1F";

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
      {/* Alert Routing Hub Enclosure */}
      <rect
        x="4"
        y="4"
        width="24"
        height="24"
        rx="3.5"
        fill={fillFoundation}
        stroke={strokeRed}
        strokeWidth="1.5"
      />

      {/* Central Alert Incident Bell / Beacon Silhouette */}
      <path
        d="M16 7.5C13.5 7.5 12 9.5 12 13V16.5L10 18.5H22L20 16.5V13C20 9.5 18.5 7.5 16 7.5Z"
        fill={fillPlate}
        stroke={strokeAccent}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />

      {/* Bell Clapper */}
      <circle cx="16" cy="20.5" r="1.5" fill={fillDeep} stroke={strokeAccent} strokeWidth="1.1" />

      {/* Alert Routing Tree Branches (Deduplication & Escalation Channels) */}
      {/* Route 1: Pager/On-call (Top Left) */}
      <path d="M12 9L7.5 6.5" stroke={strokeRed} strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="7" cy="6.5" r="1.2" fill={strokeAccent} />

      {/* Route 2: ChatOps/Slack (Top Right) */}
      <path d="M20 9L24.5 6.5" stroke={strokeRed} strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="25" cy="6.5" r="1.2" fill={strokeAccent} />

      {/* Route 3: Webhook/Auto-remediation (Bottom Center) */}
      <line x1="16" y1="22.5" x2="16" y2="25.5" stroke={strokeAccent} strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="16" cy="26" r="1" fill={strokeAccent} />
    </svg>
  );
};

