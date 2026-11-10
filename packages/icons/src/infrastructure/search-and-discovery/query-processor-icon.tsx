import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const QueryProcessorIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Query Processor",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeBlue = isColored ? "#60A5FA" : "#A3A3A3";
  const strokeAccent = isColored ? "#93C5FD" : "#E5E5E5";
  const fillFoundation = isColored ? "#1E3A8A" : "#141414";
  const fillNode = isColored ? "#1D4ED8" : "#262626";

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
      {/* Top Query Ingest Prompt Bar */}
      <rect
        x="5"
        y="4"
        width="22"
        height="7"
        rx="2"
        fill={fillFoundation}
        stroke={strokeBlue}
        strokeWidth="1.3"
      />
      {/* Query Code Prompt Symbol `> _` */}
      <path d="M8 6.5L10 7.5L8 8.5" stroke={strokeAccent} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="8.5" x2="16" y2="8.5" stroke={strokeAccent} strokeWidth="1.2" strokeLinecap="round" />

      {/* Downward Pipeline Parser Vector */}
      <line x1="16" y1="11" x2="16" y2="14" stroke={strokeBlue} strokeWidth="1.3" strokeLinecap="round" />

      {/* AST Root Node */}
      <rect
        x="12"
        y="14"
        width="8"
        height="4.5"
        rx="1"
        fill={fillNode}
        stroke={strokeAccent}
        strokeWidth="1.1"
      />
      <circle cx="16" cy="16.25" r="1" fill={strokeAccent} />

      {/* AST Branch Vectors */}
      <line x1="13.5" y1="18.5" x2="9" y2="22.5" stroke={strokeBlue} strokeWidth="1.1" />
      <line x1="18.5" y1="18.5" x2="23" y2="22.5" stroke={strokeBlue} strokeWidth="1.1" />

      {/* AST Left Leaf Node (Clause / Filter) */}
      <circle cx="8" cy="24.5" r="3" fill={fillFoundation} stroke={strokeBlue} strokeWidth="1.2" />
      <line x1="6.5" y1="24.5" x2="9.5" y2="24.5" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" />

      {/* AST Right Leaf Node (Weight / Score) */}
      <circle cx="24" cy="24.5" r="3" fill={fillFoundation} stroke={strokeBlue} strokeWidth="1.2" />
      <circle cx="24" cy="24.5" r="1" fill={strokeAccent} />

      {/* Execution Plan Output Vector (Bottom Center) */}
      <line x1="16" y1="18.5" x2="16" y2="27" stroke={strokeAccent} strokeWidth="1.2" strokeDasharray="1.5 1.5" />
    </svg>
  );
};
