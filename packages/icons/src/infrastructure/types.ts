import * as React from "react";

export type InfrastructureIconVariant = "colored" | "monochrome";

export interface InfrastructureIconProps extends Omit<React.SVGProps<SVGSVGElement>, "color"> {
  size?: number | string;
  variant?: InfrastructureIconVariant;
  decorative?: boolean;
  title?: string;
}

export type InfrastructureIconComponent = React.FC<InfrastructureIconProps>;

