import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const MetricsCollectorIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Metrics Collector",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeGreen = isColored ? "#34D399" : "#A3A3A3";
  const fillDeep = isColored ? "#064E3B" : "#262626";
  const fillFoundation = isColored ? "#022C22" : "#141414";
  const strokeAccent = isColored ? "#A7F3D0" : "#E5E5E5";
  const fillBar = isColored ? "#065F46" : "#1F1F1F";

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
      {/* Metrics Engine / Scraper Chassis */}
      <rect
        x="4"
        y="4"
        width="24"
        height="24"
        rx="3.5"
        fill={fillFoundation}
        stroke={strokeGreen}
        strokeWidth="1.5"
      />

      {/* Numerical Measurement Histogram Columns */}
      {/* Bar 1 (Low Counter) */}
      <rect x="7" y="18" width="3.5" height="7" rx="1" fill={fillBar} stroke={strokeGreen} strokeWidth="1" />
      {/* Bar 2 (Mid Gauge) */}
      <rect x="12" y="13" width="3.5" height="12" rx="1" fill={fillDeep} stroke={strokeAccent} strokeWidth="1.1" />
      {/* Bar 3 (Peak Latency Bucket) */}
      <rect x="17" y="8" width="3.5" height="17" rx="1" fill={fillBar} stroke={strokeGreen} strokeWidth="1" />
      {/* Bar 4 (Quantile Summary) */}
      <rect x="22" y="15" width="3.5" height="10" rx="1" fill={fillDeep} stroke={strokeGreen} strokeWidth="1" />

      {/* Metric Ingestion Data Point Trend Vector */}
      <path
        d="M8.75 16L13.75 11L18.75 6L23.75 13"
        stroke={strokeAccent}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Data Ingestion Sample Nodes */}
      <circle cx="8.75" cy="16" r="1.1" fill={strokeAccent} />
      <circle cx="13.75" cy="11" r="1.1" fill={strokeAccent} />
      <circle cx="18.75" cy="6" r="1.2" fill={strokeAccent} />
      <circle cx="23.75" cy="13" r="1.1" fill={strokeAccent} />
    </svg>
  );
};

