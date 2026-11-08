"use client";

import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Button } from "../../ui/button";
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
            "w-[240px] justify-start text-left font-normal text-xs h-8",
            !value.from && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
          {formatText()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="text-[11px] text-muted-foreground mb-1 block">Start Date</label>
            <input
              type="date"
              className="w-full rounded-md border border-border bg-surface px-2 py-1 text-xs text-foreground outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={value.from ? value.from.toISOString().split("T")[0] : ""}
              onChange={(e) => {
                const newFrom = e.target.value ? new Date(e.target.value) : null;
                onChange?.({ ...value, from: newFrom });
              }}
            />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-1 block">End Date</label>
            <input
              type="date"
              className="w-full rounded-md border border-border bg-surface px-2 py-1 text-xs text-foreground outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={value.to ? value.to.toISOString().split("T")[0] : ""}
              onChange={(e) => {
                const newTo = e.target.value ? new Date(e.target.value) : null;
                onChange?.({ ...value, to: newTo });
                if (newTo) setIsOpen(false);
              }}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
