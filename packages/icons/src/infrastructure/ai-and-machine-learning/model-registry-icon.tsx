import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const ModelRegistryIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Model Registry",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#06B6D4" : "#A3A3A3";
  const strokeAccent = isColored ? "#22D3EE" : "#E5E5E5";
  const fillVault = isColored ? "#083344" : "#141414";
  const fillCard = isColored ? "#155E75" : "#262626";
  const accentTag = isColored ? "#67E8F9" : "#FFFFFF";

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
      {/* Governed Model Vault Box */}
      <rect
        x="3"
        y="6"
        width="26"
        height="22"
        rx="3"
        fill={fillVault}
        stroke={strokeColor}
        strokeWidth="1.2"
      />

      {/* Model Catalog Shelves / Version Tiers */}
      {/* Tier 1 (v1.0.0) */}
      <rect x="6" y="9" width="20" height="4.5" rx="1" fill={fillCard} stroke={strokeAccent} strokeWidth="0.8" />
      <circle cx="9" cy="11.25" r="1.2" fill={accentTag} />
      <line x1="12" y1="11.25" x2="19" y2="11.25" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" />
      <rect x="21" y="10" width="3.5" height="2.5" rx="0.5" fill={accentTag} />

      {/* Tier 2 (v2.0.0 Production Stage) */}
      <rect x="6" y="15" width="20" height="4.5" rx="1" fill={fillCard} stroke={strokeAccent} strokeWidth="0.8" />
      <circle cx="9" cy="17.25" r="1.2" fill={accentTag} />
      <line x1="12" y1="17.25" x2="18" y2="17.25" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" />
      <rect x="20.5" y="16" width="4" height="2.5" rx="0.5" fill={accentTag} />

      {/* Tier 3 (Staging Lineage) */}
      <rect x="6" y="21" width="20" height="4.5" rx="1" fill={fillCard} stroke={strokeAccent} strokeWidth="0.8" />
      <circle cx="9" cy="23.25" r="1.2" fill={accentTag} />
      <line x1="12" y1="23.25" x2="17" y2="23.25" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" />

      {/* Security Governance Seal / Badge on Top */}
      <path
        d="M16 2L20 4V7C20 9.5 16 11 16 11C16 11 12 9.5 12 7V4L16 2Z"
        fill={fillVault}
        stroke={accentTag}
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="6" r="1" fill={accentTag} />
    </svg>
  );
};

