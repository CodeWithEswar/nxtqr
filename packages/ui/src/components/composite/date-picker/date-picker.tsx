"use client";

import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Button } from "../../ui/button";
import { CalendarIcon } from "@nxtqr/icons";
import { cn } from "@nxtqr/utils";

export interface DatePickerProps {
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled,
  className,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const formattedDate = value
    ? value.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-[180px] justify-start text-left font-normal text-xs h-8",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
          {formattedDate ?? placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="text-xs text-muted-foreground p-2">
          {/* Calendar Picker surface */}
          <input
            type="date"
            className="w-full rounded-md border border-border bg-surface px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            value={value ? value.toISOString().split("T")[0] : ""}
            onChange={(e) => {
              if (e.target.value) {
                onChange?.(new Date(e.target.value));
              } else {
                onChange?.(null);
              }
              setIsOpen(false);
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
