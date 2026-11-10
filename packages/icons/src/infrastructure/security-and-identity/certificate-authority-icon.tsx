import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const CertificateAuthorityIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Certificate Authority",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeBlue = isColored ? "#60A5FA" : "#A3A3A3";
  const fillDeep = isColored ? "#1E3A8A" : "#262626";
  const fillFoundation = isColored ? "#0F172A" : "#141414";
  const strokeAccent = isColored ? "#93C5FD" : "#E5E5E5";
  const strokeGold = isColored ? "#FBBF24" : "#D4D4D4";

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
      {/* X.509 Certificate Document Parchment */}
      <path
        d="M6 4.5C6 3.7 6.7 3 7.5 3H20.5L26 8.5V27.5C26 28.3 25.3 29 24.5 29H7.5C6.7 29 6 28.3 6 27.5V4.5Z"
        fill={fillFoundation}
        stroke={strokeBlue}
        strokeWidth="1.5"
      />

      {/* Folded Document Corner */}
      <path
        d="M20.5 3V8.5H26"
        fill={fillDeep}
        stroke={strokeBlue}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Certificate Hierarchy Text Lines (Subject, Issuer, Validity) */}
      <line x1="10" y1="9" x2="17" y2="9" stroke={strokeAccent} strokeWidth="1.3" strokeLinecap="round" />
      <line x1="10" y1="12.5" x2="22" y2="12.5" stroke={strokeAccent} strokeWidth="1.3" strokeLinecap="round" />
      <line x1="10" y1="16" x2="20" y2="16" stroke={strokeAccent} strokeWidth="1.3" strokeLinecap="round" />
      <line x1="10" y1="19.5" x2="16" y2="19.5" stroke={strokeAccent} strokeWidth="1.3" strokeLinecap="round" />

      {/* Trust Seal Ribbon Anchor */}
      <path
        d="M17 24L18.5 28L20 25.5L21.5 28L23 24"
        stroke={strokeGold}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Golden Root CA Signature Seal / Medallion */}
      <circle cx="20" cy="22.5" r="4.2" fill={fillDeep} stroke={strokeGold} strokeWidth="1.3" />
      <circle cx="20" cy="22.5" r="2.2" stroke={strokeAccent} strokeWidth="0.9" strokeDasharray="1.5 1" />
      <circle cx="20" cy="22.5" r="0.75" fill={strokeGold} />
    </svg>
  );
};
