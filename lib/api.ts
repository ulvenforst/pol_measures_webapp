import { MeasureConfig, MeasureResult } from "./types";

export async function computeMeasures(
  x: number[],
  weights: number[],
  measures: MeasureConfig[],
): Promise<MeasureResult[]> {
  const res = await fetch("/api/compute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ x, weights, measures }),
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  const data = await res.json();
  return data.measures;
}
