import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const KafkaBrokerIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Kafka Broker",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeIndigo = isColored ? "#818CF8" : "#A3A3A3";
  const fillChassis = isColored ? "#1E1B4B" : "#1A1A1A";
  const strokeAccent = isColored ? "#C7D2FE" : "#E5E5E5";
  const fillPartition = isColored ? "#312E81" : "#262626";

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
      {/* Outer Broker Log Node Enclosure */}
      <rect
        x="4"
        y="4"
        width="24"
        height="24"
        rx="3"
        fill={fillChassis}
        stroke={strokeIndigo}
        strokeWidth="1.5"
      />

      {/* Broker Header / Node Identifier Bar */}
      <path
        d="M4 10h24"
        stroke={strokeIndigo}
        strokeWidth="1.2"
      />
      <circle cx="8" cy="7" r="1.2" fill={strokeAccent} />
      <circle cx="12" cy="7" r="1.2" fill={strokeIndigo} />
      <path
        d="M20 7h4"
        stroke={strokeAccent}
        strokeWidth="1.1"
        strokeLinecap="round"
      />

      {/* Partition Lane 0 (Top) */}
      <rect
        x="7"
        y="12.5"
        width="18"
        height="6"
        rx="1.5"
        fill={fillPartition}
        stroke={strokeIndigo}
        strokeWidth="1.1"
      />
      {/* Log Segment Blocks in Partition 0 */}
      <path
        d="M11 12.5v6M15 12.5v6M19 12.5v6"
        stroke={strokeIndigo}
        strokeWidth="1"
      />
      {/* High-Watermark Offset Pointer */}
      <rect x="19.5" y="13.5" width="4.5" height="4" rx="0.8" fill={strokeAccent} opacity="0.85" />

      {/* Partition Lane 1 (Bottom) */}
      <rect
        x="7"
        y="20.5"
        width="18"
        height="6"
        rx="1.5"
        fill={fillPartition}
        stroke={strokeIndigo}
        strokeWidth="1.1"
      />
      {/* Log Segment Blocks in Partition 1 */}
      <path
        d="M11 20.5v6M15 20.5v6M19 20.5v6"
        stroke={strokeIndigo}
        strokeWidth="1"
      />
      {/* Committed Offset Marker */}
      <circle cx="13" cy="23.5" r="1.3" fill={strokeAccent} />
      <circle cx="17" cy="23.5" r="1.3" fill={strokeIndigo} />
    </svg>
  );
};

