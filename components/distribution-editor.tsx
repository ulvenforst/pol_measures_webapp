"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  weights: number[];
  onWeightsChange: (weights: number[]) => void;
  pointCount: number;
  onPointCountChange: (count: number) => void;
}

export function generateX(n: number): number[] {
  if (n === 1) return [0.5];
  return Array.from({ length: n }, (_, i) => i / (n - 1));
}

const BAR_HEIGHT = 180;
const MIN_POINTS = 5;

export function DistributionEditor({
  weights,
  onWeightsChange,
  pointCount,
  onPointCountChange,
}: Props) {
  const x = generateX(pointCount);
  const maxWeight = Math.max(...weights, 0.01);
  const canRemove = pointCount > MIN_POINTS;

  const handleWeightChange = (index: number, value: string) => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) return;
    const next = [...weights];
    next[index] = num;
    onWeightsChange(next);
  };

  const addPoint = () => {
    onPointCountChange(pointCount + 1);
    onWeightsChange([...weights, 0]);
  };

  const removePoint = (index: number) => {
    if (!canRemove) return;
    onPointCountChange(pointCount - 1);
    onWeightsChange(weights.filter((_, i) => i !== index));
  };

  return (
    <div className="flex items-end gap-1">
      {weights.map((w, i) => {
        const barH = maxWeight > 0 ? (w / maxWeight) * BAR_HEIGHT : 0;
        return (
          <div
            key={i}
            className="group flex-1 flex flex-col items-center gap-1"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="relative w-full flex items-end justify-center cursor-default"
                  style={{ height: BAR_HEIGHT }}
                >
                  <div
                    className="w-full rounded-t bg-chart-1 transition-all duration-150"
                    style={{ height: barH }}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-muted-foreground">x: {x[i].toFixed(4)}</p>
                <p>weight: {w}</p>
              </TooltipContent>
            </Tooltip>

            <span className="text-[11px] text-muted-foreground">
              {x[i].toFixed(2)}
            </span>

            <div className="relative w-full">
              <Input
                type="number"
                min={0}
                step={0.01}
                value={w}
                onChange={(e) => handleWeightChange(i, e.target.value)}
                className="h-8 text-center text-sm px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              {canRemove && (
                <button
                  onClick={() => removePoint(i)}
                  className="absolute -top-2 -right-1 h-4 w-4 rounded-full bg-muted text-muted-foreground hover:bg-destructive hover:text-white text-[10px] leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  &times;
                </button>
              )}
            </div>
          </div>
        );
      })}

      <div className="flex flex-col items-center gap-1">
        <div style={{ height: BAR_HEIGHT }} />
        <span className="text-[11px] text-transparent">0</span>
        <Button
          variant="outline"
          size="icon"
          onClick={addPoint}
          className="h-8 w-8 text-lg"
        >
          +
        </Button>
      </div>
    </div>
  );
}
