import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const RecommendationEngineIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Recommendation Engine",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeLavender = isColored ? "#C4B5FD" : "#A3A3A3";
  const strokeAccent = isColored ? "#E9D5FF" : "#E5E5E5";
  const fillFoundation = isColored ? "#3B0764" : "#141414";
  const fillCard = isColored ? "#581C87" : "#262626";

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
      {/* Input Signals (User Affinity, Item Vector, Context) */}
      <circle cx="5.5" cy="7.5" r="2" fill={fillFoundation} stroke={strokeLavender} strokeWidth="1.2" />
      <circle cx="5.5" cy="16" r="2" fill={fillFoundation} stroke={strokeLavender} strokeWidth="1.2" />
      <circle cx="5.5" cy="24.5" r="2" fill={fillFoundation} stroke={strokeLavender} strokeWidth="1.2" />

      {/* Convergence Vector Lines */}
      <line x1="7.5" y1="8" x2="13" y2="14" stroke={strokeLavender} strokeWidth="1" strokeDasharray="1.5 1.5" />
      <line x1="7.5" y1="16" x2="13" y2="16" stroke={strokeLavender} strokeWidth="1" />
      <line x1="7.5" y1="24" x2="13" y2="18" stroke={strokeLavender} strokeWidth="1" strokeDasharray="1.5 1.5" />

      {/* Central Ranking Diamond Core */}
      <polygon
        points="16,11 20,16 16,21 12,16"
        fill={fillFoundation}
        stroke={strokeLavender}
        strokeWidth="1.4"
      />
      <circle cx="16" cy="16" r="1.5" fill={strokeAccent} />

      {/* Ordered Recommendation Item Cards (Right) */}
      {/* Top Ranked Card #1 */}
      <rect
        x="22"
        y="5"
        width="7"
        height="6"
        rx="1.5"
        fill={fillCard}
        stroke={strokeAccent}
        strokeWidth="1.2"
      />
      <line x1="24" y1="8" x2="27" y2="8" stroke={strokeAccent} strokeWidth="1.2" strokeLinecap="round" />

      {/* Ranked Card #2 */}
      <rect
        x="22"
        y="13"
        width="7"
        height="6"
        rx="1.5"
        fill={fillCard}
        stroke={strokeLavender}
        strokeWidth="1"
      />
      <line x1="24" y1="16" x2="26.5" y2="16" stroke={strokeLavender} strokeWidth="1" strokeLinecap="round" />

      {/* Ranked Card #3 */}
      <rect
        x="22"
        y="21"
        width="7"
        height="6"
        rx="1.5"
        fill={fillFoundation}
        stroke={strokeLavender}
        strokeWidth="0.9"
      />
      <line x1="24" y1="24" x2="26" y2="24" stroke={strokeLavender} strokeWidth="0.9" strokeLinecap="round" />
    </svg>
  );
};

