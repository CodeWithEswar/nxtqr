"use client";

import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Button } from "../../ui/button";
import { Calendar } from "../../ui/calendar";
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
            "w-[200px] justify-start text-left font-normal text-xs h-8 bg-surface border-border hover:bg-secondary-surface shadow-level-1",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
          {formattedDate ?? placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 border border-border bg-black shadow-level-2"
        align="start"
      >
        <Calendar
          mode="single"
          selected={value ?? undefined}
          onSelect={(selectedDate) => {
            onChange?.(selectedDate ?? null);
            setIsOpen(false);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
