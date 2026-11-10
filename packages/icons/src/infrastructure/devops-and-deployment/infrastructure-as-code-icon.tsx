import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const InfrastructureAsCodeIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Infrastructure as Code",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#818CF8" : "#A3A3A3";
  const strokeAccent = isColored ? "#C7D2FE" : "#D4D4D4";
  const fillFoundation = isColored ? "#1E1B4B" : "#141414";
  const fillSurface = isColored ? "#312E81" : "#1F1F1F";

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
      {/* Declarative IaC Code Manifest Document (Left) */}
      <rect
        x="4"
        y="5"
        width="11"
        height="22"
        rx="2"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.3"
      />
      {/* Code Syntax Characters `{` & `}` */}
      <path
        d="M8 9.5C7 9.5 6.5 10.5 6.5 11.5C6.5 12.5 6 13 5.5 13C6 13 6.5 13.5 6.5 14.5C6.5 15.5 7 16.5 8 16.5"
        stroke={strokeAccent}
        strokeWidth="1"
        strokeLinecap="round"
      />
      <line x1="8.5" y1="19" x2="12.5" y2="19" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" />
      <line x1="8.5" y1="22" x2="11" y2="22" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" />

      {/* Declarative Provisioning Vector (Center Arrow) */}
      <path d="M16 16H18.5M18.5 16L17 14.5M18.5 16L17 17.5" stroke={strokeColor} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Provisioned Cloud Infrastructure Stacks (Right) */}
      {/* Top Resource: Compute / Instance */}
      <rect
        x="19.5"
        y="5"
        width="8.5"
        height="6"
        rx="1.5"
        fill={fillSurface}
        stroke={strokeColor}
        strokeWidth="1.1"
      />
      <circle cx="22" cy="8" r="0.8" fill={strokeAccent} />
      <line x1="24" y1="8" x2="26" y2="8" stroke={strokeAccent} strokeWidth="0.9" />

      {/* Middle Resource: Network / VPC Subnet */}
      <rect
        x="19.5"
        y="13"
        width="8.5"
        height="6"
        rx="1.5"
        fill={fillSurface}
        stroke={strokeColor}
        strokeWidth="1.1"
      />
      <line x1="21.5" y1="16" x2="26" y2="16" stroke={strokeAccent} strokeWidth="0.9" />

      {/* Bottom Resource: Storage Bucket / Volume */}
      <rect
        x="19.5"
        y="21"
        width="8.5"
        height="6"
        rx="1.5"
        fill={fillSurface}
        stroke={strokeColor}
        strokeWidth="1.1"
      />
      <circle cx="22" cy="24" r="0.8" fill={strokeAccent} />
      <circle cx="25" cy="24" r="0.8" fill={isColored ? "#34D399" : "#D4D4D4"} />
    </svg>
  );
};

