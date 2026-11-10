import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const IdentityProviderIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Identity Provider",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeViolet = isColored ? "#A78BFA" : "#A3A3A3";
  const fillDeep = isColored ? "#4C1D95" : "#262626";
  const fillFoundation = isColored ? "#2E1065" : "#141414";
  const strokeAccent = isColored ? "#DDD6FE" : "#E5E5E5";
  const strokeBlue = isColored ? "#60A5FA" : "#D4D4D4";

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
      {/* Federation Topology Connection Beams */}
      <line x1="16" y1="16" x2="6" y2="7" stroke={strokeViolet} strokeWidth="1.2" strokeDasharray="2 1.5" />
      <line x1="16" y1="16" x2="26" y2="7" stroke={strokeViolet} strokeWidth="1.2" strokeDasharray="2 1.5" />
      <line x1="16" y1="16" x2="6" y2="25" stroke={strokeViolet} strokeWidth="1.2" strokeDasharray="2 1.5" />
      <line x1="16" y1="16" x2="26" y2="25" stroke={strokeViolet} strokeWidth="1.2" strokeDasharray="2 1.5" />

      {/* Relying-Party Satellite Client Nodes */}
      <circle cx="6" cy="7" r="3" fill={fillDeep} stroke={strokeViolet} strokeWidth="1.3" />
      <circle cx="26" cy="7" r="3" fill={fillDeep} stroke={strokeViolet} strokeWidth="1.3" />
      <circle cx="6" cy="25" r="3" fill={fillDeep} stroke={strokeViolet} strokeWidth="1.3" />
      <circle cx="26" cy="25" r="3" fill={fillDeep} stroke={strokeViolet} strokeWidth="1.3" />

      {/* Central Identity Directory Hub (Core Authority) */}
      <circle cx="16" cy="16" r="7.5" fill={fillFoundation} stroke={strokeViolet} strokeWidth="1.5" />
      <circle cx="16" cy="16" r="5.5" fill={fillDeep} stroke={strokeAccent} strokeWidth="1.1" />

      {/* Central User Directory Glyph */}
      <circle cx="16" cy="14" r="1.8" fill={fillFoundation} stroke={strokeAccent} strokeWidth="1.1" />
      <path
        d="M12.5 19C12.5 17.5 14 16.8 16 16.8C18 16.8 19.5 17.5 19.5 19"
        stroke={strokeAccent}
        strokeWidth="1.1"
        strokeLinecap="round"
      />

      {/* Trust Rings / SAML-OIDC Federation Nodes */}
      <circle cx="6" cy="7" r="0.9" fill={strokeBlue} />
      <circle cx="26" cy="7" r="0.9" fill={strokeBlue} />
      <circle cx="6" cy="25" r="0.9" fill={strokeBlue} />
      <circle cx="26" cy="25" r="0.9" fill={strokeBlue} />
    </svg>
  );
};
