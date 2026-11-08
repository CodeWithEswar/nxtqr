"use client";

import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Button } from "../../ui/button";
import { Calendar } from "../../ui/calendar";
import { CalendarIcon } from "@nxtqr/icons";
import { cn } from "@nxtqr/utils";

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

export interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange) => void;
  className?: string;
}

export function DateRangePicker({
  value = { from: null, to: null },
  onChange,
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const formatText = () => {
    if (value.from && value.to) {
      return `${value.from.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${value.to.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    }
    if (value.from) {
      return `From ${value.from.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    }
    return "Pick date range";
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[260px] justify-start text-left font-normal text-xs h-8 bg-surface border-border hover:bg-secondary-surface shadow-level-1",
            !value.from && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
          {formatText()}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 border border-border bg-black shadow-level-2"
        align="start"
      >
        <Calendar
          mode="range"
          defaultMonth={value.from ?? undefined}
          selected={{
            from: value.from ?? undefined,
            to: value.to ?? undefined,
          }}
          onSelect={(range) => {
            onChange?.({
              from: range?.from ?? null,
              to: range?.to ?? null,
            });
            if (range?.from && range?.to) {
              setIsOpen(false);
            }
          }}
          numberOfMonths={2}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
