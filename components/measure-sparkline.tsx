"use client";

import { Line, LineChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

export interface SparklinePoint {
  label: string;
  value: number;
}

interface MeasureSparklineProps {
  data: SparklinePoint[];
}

const chartConfig = {
  value: { label: "Value", color: "var(--chart-1)" },
} satisfies ChartConfig;

function SparklineTiny({ data }: { data: SparklinePoint[] }) {
  return (
    <LineChart width={64} height={24} data={data}>
      <Line
        dataKey="value"
        type="natural"
        stroke="var(--chart-1)"
        strokeWidth={1.5}
        dot={false}
        isAnimationActive={false}
      />
    </LineChart>
  );
}

function SparklineExpanded({ data }: { data: SparklinePoint[] }) {
  return (
    <ChartContainer config={chartConfig} className="h-40 w-72 !aspect-auto">
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) =>
                payload?.[0]?.payload?.label ?? ""
              }
            />
          }
        />
        <Line
          dataKey="value"
          type="natural"
          stroke="var(--color-value)"
          strokeWidth={2}
          dot={{ fill: "var(--color-value)" }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ChartContainer>
  );
}

export function MeasureSparkline({ data }: MeasureSparklineProps) {
  if (data.length < 2) return null;

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <button className="cursor-default shrink-0">
          <SparklineTiny data={data} />
        </button>
      </HoverCardTrigger>
      <HoverCardContent side="top" className="w-auto p-3">
        <SparklineExpanded data={data} />
      </HoverCardContent>
    </HoverCard>
  );
}
