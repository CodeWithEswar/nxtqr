import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const TokenServiceIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Token Service",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeGreen = isColored ? "#34D399" : "#A3A3A3";
  const fillDeep = isColored ? "#064E3B" : "#262626";
  const fillFoundation = isColored ? "#022C22" : "#141414";
  const strokeAccent = isColored ? "#A7F3D0" : "#E5E5E5";
  const strokeCyan = isColored ? "#38BDF8" : "#B5B5B5";

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
      {/* Cryptographic Token Capsule / JWT Chip Contour */}
      <rect
        x="4.5"
        y="8"
        width="23"
        height="16"
        rx="4"
        fill={fillFoundation}
        stroke={strokeGreen}
        strokeWidth="1.5"
      />

      {/* Tripartite JWT Segment Dividers (Header . Payload . Signature) */}
      <line x1="12" y1="8" x2="12" y2="24" stroke={strokeGreen} strokeWidth="1.2" strokeDasharray="2 1.5" />
      <line x1="20" y1="8" x2="20" y2="24" stroke={strokeGreen} strokeWidth="1.2" strokeDasharray="2 1.5" />

      {/* Segment 1: Header (Algorithm & Typ) */}
      <rect x="6.5" y="11" width="3.5" height="4" rx="1" fill={fillDeep} stroke={strokeAccent} strokeWidth="0.9" />
      <circle cx="8.25" cy="19" r="1.1" fill={strokeCyan} />

      {/* Segment 2: Payload (Claims & Exp) */}
      <rect x="13.5" y="10.5" width="5" height="11" rx="1" fill={fillDeep} stroke={strokeGreen} strokeWidth="0.9" />
      <line x1="15" y1="13.5" x2="17" y2="13.5" stroke={strokeAccent} strokeWidth="1.1" strokeLinecap="round" />
      <line x1="15" y1="16" x2="17" y2="16" stroke={strokeAccent} strokeWidth="1.1" strokeLinecap="round" />
      <line x1="15" y1="18.5" x2="17" y2="18.5" stroke={strokeAccent} strokeWidth="1.1" strokeLinecap="round" />

      {/* Segment 3: Signature Verification Chevron */}
      <rect x="22" y="11" width="3.5" height="10" rx="1" fill={fillDeep} stroke={strokeAccent} strokeWidth="0.9" />
      <path
        d="M22.8 16L23.8 17L25 15"
        stroke={strokeAccent}
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Token Exchange / Validation Orbital Arrows */}
      <path
        d="M10 5.5H22M20 3.5L22.5 5.5L20 7.5"
        stroke={strokeCyan}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 26.5H10M12 24.5L9.5 26.5L12 28.5"
        stroke={strokeGreen}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

