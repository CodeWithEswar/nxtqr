"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-surface group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-md font-sans text-xs",
          description: "group-[.toast]:text-muted-foreground text-xs",
          actionButton:
            "group-[.toast]:bg-accent group-[.toast]:text-accent-foreground group-[.toast]:rounded-md text-xs",
          cancelButton:
            "group-[.toast]:bg-muted-surface group-[.toast]:text-muted-foreground group-[.toast]:rounded-md text-xs",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
