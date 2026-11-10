import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const FullTextSearchIndexIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Full-Text Search Index",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeViolet = isColored ? "#A78BFA" : "#A3A3A3";
  const strokeAccent = isColored ? "#DDD6FE" : "#E5E5E5";
  const fillFoundation = isColored ? "#2E1065" : "#141414";
  const fillIndexRow = isColored ? "#4C1D95" : "#262626";

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
      {/* Index Vault Outer Frame */}
      <rect
        x="4"
        y="4"
        width="24"
        height="24"
        rx="3.5"
        fill={fillFoundation}
        stroke={strokeViolet}
        strokeWidth="1.5"
      />

      {/* Index Shard Partition Grid / Matrix */}
      <line x1="12" y1="4" x2="12" y2="28" stroke={strokeViolet} strokeWidth="1.1" strokeDasharray="2 1.5" />

      {/* Inverted Index Hash Entries (Token Column) */}
      <rect x="6" y="7" width="4.5" height="4" rx="1" fill={fillIndexRow} stroke={strokeAccent} strokeWidth="0.9" />
      <rect x="6" y="14" width="4.5" height="4" rx="1" fill={fillIndexRow} stroke={strokeAccent} strokeWidth="0.9" />
      <rect x="6" y="21" width="4.5" height="4" rx="1" fill={fillIndexRow} stroke={strokeAccent} strokeWidth="0.9" />

      {/* Postings List Pointers (Doc IDs / Term Postings) */}
      <line x1="10.5" y1="9" x2="15" y2="9" stroke={strokeAccent} strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="17" cy="9" r="1.5" fill={strokeViolet} stroke={strokeAccent} strokeWidth="0.8" />
      <circle cx="21" cy="9" r="1.5" fill={strokeViolet} stroke={strokeAccent} strokeWidth="0.8" />
      <circle cx="25" cy="9" r="1.5" fill={strokeViolet} stroke={strokeAccent} strokeWidth="0.8" />

      <line x1="10.5" y1="16" x2="15" y2="16" stroke={strokeAccent} strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="17" cy="16" r="1.5" fill={strokeViolet} stroke={strokeAccent} strokeWidth="0.8" />
      <circle cx="21" cy="16" r="1.5" fill={strokeViolet} stroke={strokeAccent} strokeWidth="0.8" />

      <line x1="10.5" y1="23" x2="15" y2="23" stroke={strokeAccent} strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="17" cy="23" r="1.5" fill={strokeViolet} stroke={strokeAccent} strokeWidth="0.8" />
      <circle cx="21" cy="23" r="1.5" fill={strokeViolet} stroke={strokeAccent} strokeWidth="0.8" />
      <circle cx="25" cy="23" r="1.5" fill={strokeViolet} stroke={strokeAccent} strokeWidth="0.8" />
    </svg>
  );
};

