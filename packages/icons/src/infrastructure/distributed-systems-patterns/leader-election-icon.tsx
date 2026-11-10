import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const LeaderElectionIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Leader Election",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeBoundary = isColored ? "#FB923C" : "#A3A3A3";
  const strokeAccent = isColored ? "#FED7AA" : "#D4D4D4";
  const fillFoundation = isColored ? "#431407" : "#141414";
  const fillSurface = isColored ? "#7C2D12" : "#1F1F1F";
  const leaderColor = isColored ? "#FBBF24" : "#E5E5E5";

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
      {/* Outer Coordination Boundary */}
      <rect
        x="3"
        y="4"
        width="26"
        height="24"
        rx="4"
        fill={fillFoundation}
        stroke={strokeBoundary}
        strokeWidth="1.2"
      />

      {/* Cluster Ring / Mesh Connection Links */}
      <path
        d="M16 11L8.5 22M16 11L23.5 22M8.5 22H23.5"
        stroke={strokeBoundary}
        strokeWidth="1"
        strokeDasharray="2 1.5"
      />

      {/* Follower Node 1 (Bottom Left) */}
      <circle
        cx="8.5"
        cy="22"
        r="3.5"
        fill={fillSurface}
        stroke={strokeBoundary}
        strokeWidth="1.1"
      />
      <circle cx="8.5" cy="22" r="1.2" fill={strokeAccent} />

      {/* Follower Node 2 (Bottom Right) */}
      <circle
        cx="23.5"
        cy="22"
        r="3.5"
        fill={fillSurface}
        stroke={strokeBoundary}
        strokeWidth="1.1"
      />
      <circle cx="23.5" cy="22" r="1.2" fill={strokeAccent} />

      {/* Elected Leader Node (Elevated Apex) */}
      <circle
        cx="16"
        cy="11"
        r="4.5"
        fill={fillSurface}
        stroke={leaderColor}
        strokeWidth="1.5"
      />

      {/* Leader Crown / Star Emblem at apex */}
      <path
        d="M13.5 12.5L14 9.5L16 11L18 9.5L18.5 12.5H13.5Z"
        fill={leaderColor}
      />

      {/* Heartbeat / Lease Broadcast Arcs radiating from Leader */}
      <path
        d="M12.5 7C14.5 6 17.5 6 19.5 7"
        stroke={strokeAccent}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M11 5C14 3.8 18 3.8 21 5"
        stroke={strokeAccent}
        strokeWidth="1"
        strokeLinecap="round"
        strokeDasharray="1.5 1.5"
      />
    </svg>
  );
};

LeaderElectionIcon.displayName = "LeaderElectionIcon";
