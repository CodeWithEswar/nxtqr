import type { FC } from "react";
import { ICON_TILE } from "../tokens/branding-tokens";
import { LogoMark, type LogoMarkProps } from "./logo-mark";

export interface AppIconProps extends Omit<LogoMarkProps, "colorMode" | "variant"> {
  type?: "hero" | "black" | "white";
}

export const AppIcon: FC<AppIconProps> = ({ size = 64, type = "black", children, ...props }) => {
  const inverse = type === "white";
  const { x, y, size: tileSize, radius } = ICON_TILE;

  return (
    <LogoMark
      size={size}
      variant={type === "hero" ? "symbol" : "minimal"}
      colorMode={inverse ? "inverse" : "monochrome"}
      {...props}
    >
      <rect
        x={x}
        y={y}
        width={tileSize}
        height={tileSize}
        rx={radius}
        fill={inverse ? "#FFFFFF" : "#000000"}
      />
      {children}
    </LogoMark>
  );
};

AppIcon.displayName = "AppIcon";
