"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis } from "recharts";

interface Props {
  x: number[];
  weights: number[];
  compact?: boolean;
  maxWeight?: number;
}

const chartConfig = {
  weight: { label: "Weight", color: "var(--chart-1)" },
};

export function DistributionChart({
  x,
  weights,
  compact = false,
  maxWeight,
}: Props) {
  const data = x.map((xi, i) => ({
    x: xi.toFixed(2),
    weight: weights[i] ?? 0,
  }));

  if (compact) {
    return (
      <ChartContainer config={chartConfig} className="h-16 w-full">
        <BarChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          {maxWeight != null && <YAxis domain={[0, maxWeight]} hide />}
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(_, payload) =>
                  `x: ${payload?.[0]?.payload?.x ?? ""}`
                }
              />
            }
          />
          <Bar dataKey="weight" fill="var(--chart-1)" radius={1} />
        </BarChart>
      </ChartContainer>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-64 w-full">
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <XAxis dataKey="x" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="weight" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
