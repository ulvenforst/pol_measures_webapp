"use client";

import { useState, useEffect, useRef, useCallback } from "react";

import {
  DistributionEditor,
  generateX,
} from "@/components/distribution-editor";
import { MeasuresResults } from "@/components/measures-results";
import { SaveDialog } from "@/components/save-dialog";
import { TableSelector } from "@/components/table-selector";
import { TableView } from "@/components/table-view";
import { computeMeasures } from "@/lib/api";
import { useStore } from "@/lib/store";
import { Distribution, MeasureResult } from "@/lib/types";

const DEFAULT_POINTS = 5;
const DEFAULT_WEIGHTS = [0.2, 0.2, 0.2, 0.2, 0.2];

export default function HomePage() {
  const [pointCount, setPointCount] = useState(DEFAULT_POINTS);
  const [weights, setWeights] = useState<number[]>(DEFAULT_WEIGHTS);
  const [measures, setMeasures] = useState<MeasureResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const { tables, activeMeasures, setActiveMeasures } = useStore();
  const [activeTableId, setActiveTableId] = useState<string | null>(null);

  const x = generateX(pointCount);

  const fetchMeasures = useCallback(
    (
      currentX: number[],
      currentWeights: number[],
      configs: typeof activeMeasures,
    ) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      const hasPositiveWeight = currentWeights.some((w) => w > 0);
      if (!hasPositiveWeight || configs.length === 0) return;

      debounceRef.current = setTimeout(async () => {
        setLoading(true);
        try {
          const results = await computeMeasures(
            currentX,
            currentWeights,
            configs,
          );
          setMeasures(results);
        } catch {
          // API unreachable — leave last results
        } finally {
          setLoading(false);
        }
      }, 300);
    },
    [],
  );

  useEffect(() => {
    fetchMeasures(x, weights, activeMeasures);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weights, pointCount, activeMeasures]);

  useEffect(() => {
    if (!activeTableId && tables.length > 0) {
      setActiveTableId(tables[0].id);
    }
    if (activeTableId && !tables.find((t) => t.id === activeTableId)) {
      setActiveTableId(tables.length > 0 ? tables[0].id : null);
    }
  }, [tables, activeTableId]);

  const buildDistribution = (name: string): Distribution => ({
    id: crypto.randomUUID(),
    name,
    x,
    weights,
    measures,
  });

  const canSave = measures.length > 0 && measures.some((m) => m.value != null);
  const activeTable = tables.find((t) => t.id === activeTableId) ?? null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
      {/* Calculator section */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-start">
        <DistributionEditor
          weights={weights}
          onWeightsChange={setWeights}
          pointCount={pointCount}
          onPointCountChange={setPointCount}
        />

        <MeasuresResults
          measures={measures}
          loading={loading}
          onSave={() => setSaveOpen(true)}
          canSave={canSave}
          activeMeasures={activeMeasures}
          onMeasuresChange={setActiveMeasures}
        />
      </div>

      <SaveDialog
        buildDistribution={buildDistribution}
        disabled={!canSave}
        open={saveOpen}
        onOpenChange={setSaveOpen}
        x={x}
        weights={weights}
      />

      {/* Tables section */}
      <div className="space-y-4">
        <TableSelector
          activeTableId={activeTableId}
          onSelect={setActiveTableId}
        />

        {activeTable ? (
          <TableView table={activeTable} />
        ) : tables.length === 0 ? null : (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Select a table above.
          </p>
        )}
      </div>
    </div>
  );
}
