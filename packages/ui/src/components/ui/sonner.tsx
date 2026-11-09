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
            "group toast group-[.toaster]:bg-surface-02 group-[.toaster]:text-foreground group-[.toaster]:border-border-default group-[.toaster]:shadow-level-2 group-[.toaster]:rounded-md font-sans text-xs",
          description: "group-[.toast]:text-muted-foreground text-xs",
          actionButton:
            "group-[.toast]:bg-surface-03 group-[.toast]:text-foreground group-[.toast]:rounded-md text-xs group-[.toast]:border group-[.toast]:border-border-default",
          cancelButton:
            "group-[.toast]:bg-surface-01 group-[.toast]:text-muted-foreground group-[.toast]:rounded-md text-xs",
          success:
            "group-[.toaster]:border-emerald-500/40 group-[.toaster]:bg-surface-02 text-foreground [&_[data-icon]]:text-emerald-400",
          error:
            "group-[.toaster]:border-red-500/40 group-[.toaster]:bg-surface-02 text-foreground [&_[data-icon]]:text-red-400",
          warning:
            "group-[.toaster]:border-amber-500/40 group-[.toaster]:bg-surface-02 text-foreground [&_[data-icon]]:text-amber-400",
          info:
            "group-[.toaster]:border-sky-500/40 group-[.toaster]:bg-surface-02 text-foreground [&_[data-icon]]:text-sky-400",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
