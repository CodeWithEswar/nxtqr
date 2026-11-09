import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const ReadReplicaIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Read Replica",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeBlue = isColored ? "#60A5FA" : "#A3A3A3";
  const fillFoundation = isColored ? "#1E3A8A" : "#1A1A1A";
  const strokePath = isColored ? "#38BDF8" : "#737373";
  const strokeAccent = isColored ? "#93C5FD" : "#D4D4D4";
  const fillDot = isColored ? "#DBEAFE" : "#E5E5E5";

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
      {/* Primary Source Node (Left, Smaller) */}
      <ellipse
        cx="8"
        cy="7"
        rx="5.5"
        ry="2"
        fill={fillFoundation}
        stroke={strokeBlue}
        strokeWidth="1.3"
      />
      <path
        d="M2.5 7v10c0 1.1 2.46 2 5.5 2s5.5-.9 5.5-2V7"
        stroke={strokeBlue}
        strokeWidth="1.3"
      />
      <path
        d="M2.5 12c0 1.1 2.46 2 5.5 2s5.5-.9 5.5-2"
        stroke={strokePath}
        strokeWidth="1"
      />

      {/* Directional Asynchronous Replication Flow Stream */}
      <path
        d="M13.5 13.5c3-3 5-3 8-1"
        stroke={strokePath}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M20 10.5l2 2-2 2"
        stroke={strokeAccent}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dedicated Read Replica Node (Right, Prominent) */}
      <ellipse
        cx="23.5"
        cy="15"
        rx="6"
        ry="2.2"
        fill={fillFoundation}
        stroke={strokeBlue}
        strokeWidth="1.5"
      />
      <path
        d="M17.5 15v11c0 1.22 2.69 2.2 6 2.2s6-.98 6-2.2v-11"
        stroke={strokeBlue}
        strokeWidth="1.5"
      />
      <path
        d="M17.5 20.5c0 1.22 2.69 2.2 6 2.2s6-.98 6-2.2"
        stroke={strokePath}
        strokeWidth="1.2"
      />

      {/* Read-Only Query Indicator (Egress Eye/Lens Dot) */}
      <circle cx="23.5" cy="24" r="1.25" fill={fillDot} />
    </svg>
  );
};

