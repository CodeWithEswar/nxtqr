import type { FC } from "react";
import { LogoMark, type LogoMarkProps } from "./logo-mark";

export interface AnimatedLogoProps extends LogoMarkProps {
  mode?: "entrance" | "loading" | "interactive";
  showFraming?: boolean;
}

const motionStyles = `
  @media (prefers-reduced-motion: no-preference) {
    [data-nxtqr-motion] [data-nxtqr-aperture] {
      transform-box: fill-box;
      transform-origin: center;
    }
    [data-nxtqr-motion="entrance"] [data-nxtqr-aperture] {
      animation: nxtqrSettle 420ms cubic-bezier(0.2, 0.75, 0.25, 1) both;
    }
    [data-nxtqr-motion="loading"] [data-nxtqr-aperture] {
      animation: nxtqrSettle 700ms ease-in-out infinite alternate;
    }
    [data-nxtqr-motion="interactive"] [data-nxtqr-aperture] {
      transition: transform 160ms ease-out;
    }
    :is(a:hover, a:focus-visible) [data-nxtqr-motion="interactive"] [data-nxtqr-aperture] {
      transform: translate(2px, -2px);
    }
  }

  @keyframes nxtqrSettle {
    from { opacity: 0.55; transform: translate(-4px, 4px) scale(0.94); }
    to { opacity: 1; transform: translate(0, 0) scale(1); }
  }
`;

export const AnimatedLogo: FC<AnimatedLogoProps> = ({
  size = 48,
  mode = "entrance",
  variant = "symbol",
  showFraming = variant === "symbol",
  children,
  ...props
}) => (
  <LogoMark
    size={size}
    variant={showFraming ? "symbol" : "minimal"}
    data-nxtqr-motion={mode}
    {...props}
  >
    <style>{motionStyles}</style>
    {children}
  </LogoMark>
);

AnimatedLogo.displayName = "AnimatedLogo";
