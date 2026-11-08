"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { ChevronLeftIcon, ChevronRightIcon } from "@nxtqr/icons";
import { cn } from "@nxtqr/utils";
import { buttonVariants } from "./button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 bg-surface border border-border rounded-md shadow-level-1 inline-block select-none", className)}
      classNames={{
        months: "relative flex flex-col sm:flex-row gap-4",
        month: "space-y-3",
        month_caption: "relative flex justify-center items-center h-8",
        caption_label: "text-xs font-mono font-semibold text-foreground tracking-tight",
        nav: "flex items-center justify-between absolute inset-x-0 top-0 h-8 px-1 pointer-events-none z-10",
        button_previous: cn(
          buttonVariants({ variant: "outline", size: "icon-sm" }),
          "pointer-events-auto h-7 w-7 rounded-md inline-flex items-center justify-center border border-border bg-surface text-muted-foreground hover:text-foreground active:bg-secondary-surface active:shadow-level-3 transition-colors shadow-level-1 outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        ),
        button_next: cn(
          buttonVariants({ variant: "outline", size: "icon-sm" }),
          "pointer-events-auto h-7 w-7 rounded-md inline-flex items-center justify-center border border-border bg-surface text-muted-foreground hover:text-foreground active:bg-secondary-surface active:shadow-level-3 transition-colors shadow-level-1 outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        ),
        month_grid: "w-full border-collapse font-mono",
        weekdays: "border-b border-subtle-border",
        weekday:
          "w-8 h-8 p-0 text-center font-normal text-[10px] text-muted-foreground uppercase tracking-wider",
        weeks: "",
        week: "mt-1",
        day: "group/day p-0.5 text-center text-xs relative rounded-md",
        day_button: cn(
          "h-7 w-7 p-0 font-mono text-xs font-normal rounded-md inline-flex items-center justify-center transition-colors text-foreground hover:bg-secondary-surface outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "group-data-[selected=true]/day:!bg-accent group-data-[selected=true]/day:!text-accent-foreground group-data-[selected=true]/day:font-semibold group-data-[selected=true]/day:shadow-level-1 group-data-[selected=true]/day:hover:!bg-accent group-data-[selected=true]/day:hover:!text-accent-foreground",
          "group-data-[today=true]/day:border group-data-[today=true]/day:border-border group-data-[today=true]/day:font-bold",
          "group-data-[outside=true]/day:text-muted-foreground/35 group-data-[outside=true]/day:hover:text-muted-foreground/60",
          "group-data-[disabled=true]/day:text-muted-foreground/20 group-data-[disabled=true]/day:cursor-not-allowed group-data-[disabled=true]/day:hover:bg-transparent",
        ),
        range_start: "rounded-l-md !bg-accent !text-accent-foreground font-semibold",
        range_end: "rounded-r-md !bg-accent !text-accent-foreground font-semibold",
        range_middle: "!bg-secondary-surface !text-foreground rounded-none",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeftIcon className="h-3.5 w-3.5" />
          ) : (
            <ChevronRightIcon className="h-3.5 w-3.5" />
          ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
