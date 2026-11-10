import type { FC } from "react";
import { LOGO_GEOMETRY } from "../tokens/branding-tokens";
import { LogoMark, type LogoMarkProps } from "./logo-mark";

export interface AnimatedLogoProps extends LogoMarkProps {
  mode?: "entrance" | "loading" | "interactive";
  showFraming?: boolean;
}

const revealStart = "polygon(0 0, -100% 0, 0 100%, 0 100%) fill-box";
const revealEnd = "polygon(0 0, 100% 0, 200% 100%, 0 100%) fill-box";
const revealEase = "cubic-bezier(0.32, 0, 0.22, 1)";

const motionStyles = `
  @media (prefers-reduced-motion: no-preference) {
    [data-nxtqr-motion="entrance"] [data-nxtqr-aperture] {
      animation: nxtqrBrandReveal 620ms ${revealEase} both;
    }
    [data-nxtqr-motion="loading"] [data-nxtqr-aperture] {
      opacity: 0.25;
    }
    [data-nxtqr-motion="loading"] [data-nxtqr-reveal] {
      animation: nxtqrLoadingReveal 1600ms ${revealEase} infinite;
    }
    [data-nxtqr-motion="interactive"] [data-nxtqr-aperture] {
      transition: transform 160ms ease-out;
    }
    :is(a:hover, a:focus-visible) [data-nxtqr-motion="interactive"] [data-nxtqr-aperture] {
      transform: translate(2px, -2px);
    }
  }

  @keyframes nxtqrBrandReveal {
    from { clip-path: ${revealStart}; }
    to { clip-path: ${revealEnd}; }
  }

  @keyframes nxtqrLoadingReveal {
    0% { clip-path: ${revealStart}; opacity: 1; }
    45%, 78% { clip-path: ${revealEnd}; opacity: 1; }
    98%, 100% { clip-path: ${revealEnd}; opacity: 0; }
  }
`;

export const AnimatedLogo: FC<AnimatedLogoProps> = ({
  size = 48,
  mode = "entrance",
  colorMode = "current",
  variant = "symbol",
  showFraming = variant === "symbol",
  children,
  ...props
}) => (
  <LogoMark
    size={size}
    colorMode={colorMode}
    variant={showFraming ? "symbol" : "minimal"}
    data-nxtqr-motion={mode}
    {...props}
  >
    <style>{motionStyles}</style>
    {mode === "loading" && (
      <path
        d={LOGO_GEOMETRY.aperturePath}
        data-nxtqr-reveal=""
        fill={
          colorMode === "inverse"
            ? "#000000"
            : colorMode === "monochrome"
              ? "#FFFFFF"
              : "currentColor"
        }
        fillRule="evenodd"
        opacity={0}
      />
    )}
    {children}
  </LogoMark>
);

AnimatedLogo.displayName = "AnimatedLogo";
