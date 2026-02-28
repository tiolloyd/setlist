"use client";

import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface RadiusSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function RadiusSlider({ value, onChange }: RadiusSliderProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Search Radius</Label>
        <span className="text-sm font-semibold text-primary">{value} miles</span>
      </div>
      <Slider
        min={5}
        max={250}
        step={5}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>5 mi</span>
        <span>250 mi</span>
      </div>
    </div>
  );
}
