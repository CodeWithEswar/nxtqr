import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const ApmServiceIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "APM Service",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeBlue = isColored ? "#60A5FA" : "#A3A3A3";
  const fillDeep = isColored ? "#1E3A8A" : "#262626";
  const fillFoundation = isColored ? "#0F172A" : "#141414";
  const strokeAccent = isColored ? "#93C5FD" : "#E5E5E5";
  const fillGauge = isColored ? "#1D4ED8" : "#1F1F1F";
  const strokeTeal = isColored ? "#2DD4BF" : "#C4C4C4";

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
      {/* Application Performance Module Outer Chamber */}
      <circle cx="16" cy="16" r="12" fill={fillFoundation} stroke={strokeBlue} strokeWidth="1.5" />

      {/* Latency & Throughput Speedometer Outer Arc */}
      <path
        d="M8.5 22C6.5 18.5 7 14 9.5 10.5C12.5 7 17.5 6 21.5 8C24.5 10 26 13.5 25.5 17.5C25 20.5 23 23 20 24"
        stroke={strokeBlue}
        strokeWidth="1.3"
        strokeDasharray="3 2"
      />

      {/* Internal Runtime Metric Hub */}
      <circle cx="16" cy="18" r="3.8" fill={fillDeep} stroke={strokeAccent} strokeWidth="1.2" />

      {/* P99 Latency High-Performance Indicator Needle */}
      <line x1="16" y1="18" x2="21.5" y2="11.5" stroke={strokeAccent} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="16" cy="18" r="1.3" fill={strokeAccent} />

      {/* Performance Target Threshold Ticks (p50, p95, p99) */}
      <line x1="10.5" y1="13.5" x2="12" y2="14.5" stroke={strokeTeal} strokeWidth="1.3" strokeLinecap="round" />
      <line x1="16" y1="7.5" x2="16" y2="9.5" stroke={strokeAccent} strokeWidth="1.4" strokeLinecap="round" />
      <line x1="21.5" y1="13.5" x2="20" y2="14.5" stroke={strokeBlue} strokeWidth="1.3" strokeLinecap="round" />

      {/* Runtime Transaction Segment Base */}
      <rect x="11" y="23" width="10" height="3.5" rx="1" fill={fillGauge} stroke={strokeBlue} strokeWidth="1.1" />
      <circle cx="16" cy="24.75" r="0.75" fill={strokeAccent} />
    </svg>
  );
};

