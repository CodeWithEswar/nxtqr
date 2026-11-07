import type { SVGProps, ComponentType, FC, ReactElement } from "react";
import { cn } from "@nxtqr/utils";

export interface IconBaseProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number;
  className?: string;
  "aria-label"?: string;
  "aria-hidden"?: boolean;
}

export type IconComponent = ComponentType<IconBaseProps>;

/**
 * Standardized icon wrapper ensuring consistent 1.5 stroke width,
 * 16px default size, and strict accessible semantics.
 */
export const createIcon = (
  displayName: string,
  svgContent: (props: IconBaseProps) => ReactElement,
): IconComponent => {
  const Component: FC<IconBaseProps> = ({
    size = 16,
    strokeWidth = 1.5,
    className,
    "aria-label": ariaLabel,
    "aria-hidden": ariaHidden,
    ...props
  }) => {
    const isHidden = ariaHidden ?? !ariaLabel;

    return svgContent({
      width: size,
      height: size,
      strokeWidth,
      className: cn("shrink-0 select-none inline-block", className),
      "aria-label": ariaLabel,
      "aria-hidden": isHidden,
      role: isHidden ? "presentation" : "img",
      ...props,
    });
  };

  Component.displayName = displayName;
  return Component;
};
