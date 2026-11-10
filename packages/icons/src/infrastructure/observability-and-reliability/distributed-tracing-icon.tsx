import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const DistributedTracingIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Distributed Tracing",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeViolet = isColored ? "#A78BFA" : "#A3A3A3";
  const fillDeep = isColored ? "#4C1D95" : "#262626";
  const fillFoundation = isColored ? "#2E1065" : "#141414";
  const strokeAccent = isColored ? "#DDD6FE" : "#E5E5E5";
  const fillSpan = isColored ? "#6D28D9" : "#1F1F1F";

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
      {/* Trace Timeline Canvas Frame */}
      <rect
        x="3.5"
        y="4"
        width="25"
        height="24"
        rx="3.5"
        fill={fillFoundation}
        stroke={strokeViolet}
        strokeWidth="1.5"
      />

      {/* Vertical Trace Correlation Guideline */}
      <line x1="9" y1="4" x2="9" y2="28" stroke={strokeViolet} strokeWidth="1" strokeDasharray="2 2" />

      {/* Span 1: Root Parent Service Span (Gateway) */}
      <rect x="7" y="7.5" width="18" height="4" rx="1.2" fill={fillSpan} stroke={strokeAccent} strokeWidth="1.2" />
      <circle cx="9" cy="9.5" r="1.1" fill={strokeAccent} />

      {/* Parent-Child Correlation Beam 1 -> 2 */}
      <path d="M11 11.5V14H13" stroke={strokeViolet} strokeWidth="1.2" strokeLinejoin="round" />

      {/* Span 2: Intermediate Microservice Span */}
      <rect x="13" y="13.5" width="12" height="4" rx="1.2" fill={fillDeep} stroke={strokeViolet} strokeWidth="1.1" />

      {/* Parent-Child Correlation Beam 2 -> 3 */}
      <path d="M16 17.5V20H18" stroke={strokeViolet} strokeWidth="1.2" strokeLinejoin="round" />

      {/* Span 3: Downstream Database / Cache Query Span */}
      <rect x="18" y="19.5" width="7" height="4" rx="1.2" fill={fillSpan} stroke={strokeAccent} strokeWidth="1.1" />

      {/* Trace Latency Tick Mark */}
      <circle cx="25" cy="21.5" r="0.9" fill={strokeAccent} />
    </svg>
  );
};

