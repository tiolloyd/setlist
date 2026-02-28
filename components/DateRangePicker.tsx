"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { addDays, addMonths, format } from "date-fns";

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartChange: (date: string) => void;
  onEndChange: (date: string) => void;
}

const today = () => new Date();
const fmt = (d: Date) => format(d, "yyyy-MM-dd");

const PRESETS = [
  {
    label: "Next 2 Weeks",
    getRange: () => ({ start: fmt(today()), end: fmt(addDays(today(), 14)) }),
  },
  {
    label: "Next Month",
    getRange: () => ({ start: fmt(today()), end: fmt(addMonths(today(), 1)) }),
  },
  {
    label: "Next 3 Months",
    getRange: () => ({ start: fmt(today()), end: fmt(addMonths(today(), 3)) }),
  },
];

export function DateRangePicker({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
}: DateRangePickerProps) {
  return (
    <div className="space-y-3">
      <Label>Date Range</Label>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => {
          const { start, end } = preset.getRange();
          const isActive = startDate === start && endDate === end;
          return (
            <Button
              key={preset.label}
              type="button"
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => {
                onStartChange(start);
                onEndChange(end);
              }}
            >
              {preset.label}
            </Button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="startDate" className="text-xs text-muted-foreground">
            From
          </Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            min={fmt(today())}
            onChange={(e) => onStartChange(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="endDate" className="text-xs text-muted-foreground">
            To
          </Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => onEndChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
