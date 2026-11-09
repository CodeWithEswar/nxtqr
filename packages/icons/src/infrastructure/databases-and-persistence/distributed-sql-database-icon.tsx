import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const DistributedSqlDatabaseIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Distributed SQL Database",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeIndigo = isColored ? "#818CF8" : "#A3A3A3";
  const fillNode = isColored ? "#1E1B4B" : "#1A1A1A";
  const strokePath = isColored ? "#6366F1" : "#737373";
  const strokeAccent = isColored ? "#C7D2FE" : "#D4D4D4";
  const fillRaft = isColored ? "#312E81" : "#262626";
  const fillDot = isColored ? "#EEF2FF" : "#E5E5E5";

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
      {/* Distributed Replication & Consensus Mesh Bus (Raft / Paxos) */}
      <path
        d="M16 8v16M8 20l8-4 8 4"
        stroke={strokePath}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Consensus Core Hub Indicator */}
      <circle cx="16" cy="16" r="2.5" fill={fillRaft} stroke={strokeAccent} strokeWidth="1.2" />
      <circle cx="16" cy="16" r="1" fill={fillDot} />

      {/* Top Distributed Node 1 */}
      <ellipse cx="16" cy="5" rx="5" ry="1.8" fill={fillNode} stroke={strokeIndigo} strokeWidth="1.3" />
      <path d="M11 5v4c0 1 2.24 1.8 5 1.8s5-.8 5-1.8v-4" stroke={strokeIndigo} strokeWidth="1.3" />

      {/* Bottom-Left Distributed Node 2 */}
      <ellipse cx="7" cy="21" rx="4.5" ry="1.6" fill={fillNode} stroke={strokeIndigo} strokeWidth="1.3" />
      <path d="M2.5 21v4c0 .88 2.01 1.6 4.5 1.6s4.5-.72 4.5-1.6v-4" stroke={strokeIndigo} strokeWidth="1.3" />

      {/* Bottom-Right Distributed Node 3 */}
      <ellipse cx="25" cy="21" rx="4.5" ry="1.6" fill={fillNode} stroke={strokeIndigo} strokeWidth="1.3" />
      <path d="M20.5 21v4c0 .88 2.01 1.6 4.5 1.6s4.5-.72 4.5-1.6v-4" stroke={strokeIndigo} strokeWidth="1.3" />
    </svg>
  );
};

