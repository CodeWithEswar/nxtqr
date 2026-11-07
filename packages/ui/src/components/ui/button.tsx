"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@nxtqr/utils";
import { SpinnerIcon } from "@nxtqr/icons";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-accent text-accent-foreground shadow-level-1 hover:opacity-95 active:shadow-level-3 active:translate-y-[0.5px]",
        secondary:
          "bg-surface text-foreground border border-border shadow-level-1 hover:bg-elevated-surface active:bg-secondary-surface active:shadow-level-3 active:translate-y-[0.5px]",
        outline:
          "border border-border bg-transparent shadow-level-1 hover:bg-surface hover:text-foreground active:shadow-level-3 active:translate-y-[0.5px]",
        ghost:
          "hover:bg-surface hover:text-foreground active:bg-secondary-surface active:shadow-level-3",
        destructive:
          "bg-destructive text-destructive-foreground shadow-level-1 hover:bg-destructive/90 active:shadow-level-3 active:translate-y-[0.5px]",
        link: "text-accent underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 px-3 py-1.5",
        sm: "h-7 rounded-md px-2.5 text-xs",
        lg: "h-9 rounded-md px-4 text-sm",
        icon: "h-8 w-8",
        "icon-sm": "h-7 w-7",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, isLoading = false, children, disabled, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <SpinnerIcon className="mr-2 h-3.5 w-3.5" />
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
