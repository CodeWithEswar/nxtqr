import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const VpcIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Virtual Private Cloud",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeVpc = isColored ? "#60A5FA" : "#A3A3A3";
  const fillVpc = isColored ? "#1E3A8A" : "#1A1A1A";
  const strokeCore = isColored ? "#818CF8" : "#737373";
  const fillCore = isColored ? "#312E81" : "#262626";
  const strokeSubnet = isColored ? "#38BDF8" : "#525252";
  const fillAccent = isColored ? "#93C5FD" : "#D4D4D4";

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
      {/* Outer Isolated Virtual Cloud Perimeter */}
      <rect
        x="4"
        y="4"
        width="24"
        height="24"
        rx="4"
        fill={fillVpc}
        stroke={strokeVpc}
        strokeWidth="1.5"
        strokeDasharray="4 2"
      />

      {/* 4 Corner Protection Brackets */}
      <path d="M4 9V6a2 2 0 0 1 2-2h3M28 9V6a2 2 0 0 0-2-2h-3M4 23v3a2 2 0 0 0 2 2h3M28 23v3a2 2 0 0 1-2 2h-3" stroke={strokeVpc} strokeWidth="1.5" strokeLinecap="round" />

      {/* Central Virtual Router Hub */}
      <circle cx="16" cy="16" r="4.5" fill={fillCore} stroke={strokeCore} strokeWidth="1.5" />
      <circle cx="16" cy="16" r="2" fill={fillAccent} />

      {/* Inter-Subnet Mesh Links */}
      <path
        d="M16 11.5V8M16 20.5V24M11.5 16H8M20.5 16H24"
        stroke={strokeSubnet}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="8" cy="8" r="1.5" fill={strokeSubnet} />
      <circle cx="24" cy="8" r="1.5" fill={strokeSubnet} />
      <circle cx="8" cy="24" r="1.5" fill={strokeSubnet} />
      <circle cx="24" cy="24" r="1.5" fill={strokeSubnet} />
    </svg>
  );
};
