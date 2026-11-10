import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const SearchIndexerIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Search Indexer",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeGreen = isColored ? "#34D399" : "#A3A3A3";
  const strokeAccent = isColored ? "#6EE7B7" : "#E5E5E5";
  const fillFoundation = isColored ? "#064E3B" : "#141414";
  const fillCog = isColored ? "#047857" : "#262626";

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
      {/* Source Ingestion Pipeline Funnel */}
      <path
        d="M4 6H13L17 13V26H9V13L4 6Z"
        fill={fillFoundation}
        stroke={strokeGreen}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />

      {/* Inbound Document Stream Lines */}
      <line x1="6.5" y1="8.5" x2="11.5" y2="8.5" stroke={strokeAccent} strokeWidth="1.1" strokeLinecap="round" />
      <line x1="8" y1="11" x2="11" y2="11" stroke={strokeAccent} strokeWidth="1.1" strokeLinecap="round" />

      {/* Indexing Processing Gear / Cogwheel */}
      <circle cx="22" cy="18" r="6" fill={fillCog} stroke={strokeGreen} strokeWidth="1.4" />
      <circle cx="22" cy="18" r="2.5" fill={fillFoundation} stroke={strokeAccent} strokeWidth="1.1" />

      {/* Cog Teeth */}
      <line x1="22" y1="10" x2="22" y2="12" stroke={strokeGreen} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="22" y1="24" x2="22" y2="26" stroke={strokeGreen} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="14" y1="18" x2="16" y2="18" stroke={strokeGreen} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="28" y1="18" x2="30" y2="18" stroke={strokeGreen} strokeWidth="1.5" strokeLinecap="round" />

      {/* Index Shard Emitter Arrow */}
      <path
        d="M13 19.5L16 19.5"
        stroke={strokeAccent}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
};

