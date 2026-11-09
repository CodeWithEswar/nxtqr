import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const EventStoreIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Event Store",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeViolet = isColored ? "#A78BFA" : "#A3A3A3";
  const fillVault = isColored ? "#2E1065" : "#1A1A1A";
  const strokeAccent = isColored ? "#DDD6FE" : "#E5E5E5";
  const fillBlock = isColored ? "#4C1D95" : "#262626";

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
      {/* Append-Only Ledger / Event Store Vault Chassis */}
      <rect
        x="5"
        y="5"
        width="22"
        height="22"
        rx="3"
        fill={fillVault}
        stroke={strokeViolet}
        strokeWidth="1.5"
      />

      {/* Immutable Event Block Stream (Vertical Chain of Blocks) */}
      {/* Event Block 1 (Genesis Event / Oldest) */}
      <rect
        x="8.5"
        y="8"
        width="15"
        height="4"
        rx="1"
        fill={fillBlock}
        stroke={strokeViolet}
        strokeWidth="1.1"
      />
      <circle cx="11.5" cy="10" r="1" fill={strokeAccent} />
      <path d="M14.5 10h6" stroke={strokeViolet} strokeWidth="1" strokeLinecap="round" />

      {/* Event Block 2 (Mid Stream) */}
      <rect
        x="8.5"
        y="14"
        width="15"
        height="4"
        rx="1"
        fill={fillBlock}
        stroke={strokeViolet}
        strokeWidth="1.1"
      />
      <circle cx="11.5" cy="16" r="1" fill={strokeViolet} />
      <path d="M14.5 16h6" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" />

      {/* Event Block 3 (Head / Latest Appended Event) */}
      <rect
        x="8.5"
        y="20"
        width="15"
        height="4"
        rx="1"
        fill={fillBlock}
        stroke={strokeAccent}
        strokeWidth="1.2"
      />
      <circle cx="11.5" cy="22" r="1" fill={strokeAccent} />
      <path d="M14.5 22h6" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" />

      {/* Append Direction Pointer (Incoming Append Arrow at bottom) */}
      <path
        d="M26.5 22h3M28 20.5l1.5 1.5-1.5 1.5"
        stroke={strokeAccent}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Replay Temporal Read Loop / Cursor on Left */}
      <path
        d="M5 16H2.5M3.5 14.5L2 16l1.5 1.5"
        stroke={strokeViolet}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
