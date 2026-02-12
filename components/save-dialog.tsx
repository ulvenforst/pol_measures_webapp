"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { Distribution } from "@/lib/types";
import { DEFAULT_TABLE_ID } from "@/lib/default-table";

interface Props {
  buildDistribution: (name: string) => Distribution;
  disabled?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  x: number[];
  weights: number[];
}

function arraysEqual(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

export function SaveDialog({
  buildDistribution,
  disabled,
  open,
  onOpenChange,
  x,
  weights,
}: Props) {
  const {
    tables,
    distributions,
    saveDistribution,
    addTable,
    addToTable,
    addMeasureNames,
  } = useStore();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [newTableName, setNewTableName] = useState("");
  const [distName, setDistName] = useState("");

  const findMatchingDistId = (tableId: string): string | null => {
    const table = tables.find((t) => t.id === tableId);
    if (!table) return null;
    for (const distId of table.distributionIds) {
      const existing = distributions[distId];
      if (!existing) continue;
      if (
        arraysEqual(existing.x, x) &&
        arraysEqual(existing.weights, weights)
      ) {
        return distId;
      }
    }
    return null;
  };

  const handleSave = () => {
    const name = distName.trim() || "Untitled";
    const newDist = buildDistribution(name);

    let savedNewDist = false;

    selected.forEach((tableId) => {
      const matchId = findMatchingDistId(tableId);
      if (matchId) {
        const existing = distributions[matchId];
        const existingNames = new Set(existing.measures.map((m) => m.name));
        const newMeasures = newDist.measures.filter(
          (m) => !existingNames.has(m.name),
        );
        if (newMeasures.length > 0) {
          saveDistribution({
            ...existing,
            measures: [...existing.measures, ...newMeasures],
          });
          addMeasureNames(
            tableId,
            newMeasures.map((m) => m.name),
          );
        }
      } else {
        if (!savedNewDist) {
          saveDistribution(newDist);
          savedNewDist = true;
        }
        addToTable(tableId, newDist.id);
      }
    });

    if (newTableName.trim()) {
      if (!savedNewDist) {
        saveDistribution(newDist);
        savedNewDist = true;
      }
      const table = addTable(newTableName.trim());
      addToTable(table.id, newDist.id);
    }

    onOpenChange(false);
    setSelected(new Set());
    setNewTableName("");
    setDistName("");
  };

  const toggleTable = (tableId: string) => {
    const next = new Set(selected);
    if (next.has(tableId)) next.delete(tableId);
    else next.add(tableId);
    setSelected(next);
  };

  const hasSelection = selected.size > 0 || newTableName.trim().length > 0;

  if (disabled) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Distribution</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Distribution Name</Label>
            <Input
              placeholder="e.g. D1, Bimodal, Survey #3"
              value={distName}
              onChange={(e) => setDistName(e.target.value)}
              autoFocus
            />
          </div>

          {tables.length > 0 && (
            <div className="space-y-2">
              <Label>Add to Existing Tables</Label>
              {tables.map((t) => {
                const isDefault = t.id === DEFAULT_TABLE_ID;
                const matchId = isDefault ? null : findMatchingDistId(t.id);
                return (
                  <label
                    key={t.id}
                    className={`flex items-center gap-2 text-sm ${isDefault ? "text-muted-foreground" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(t.id)}
                      disabled={isDefault}
                      onChange={() => toggleTable(t.id)}
                    />
                    {t.name}
                    {isDefault && <span className="text-xs">(read-only)</span>}
                    {matchId && (
                      <span className="text-xs text-muted-foreground">
                        (will update measures)
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          )}

          <div className="space-y-2">
            <Label>Or Create New Table</Label>
            <Input
              placeholder="Table name"
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={!hasSelection}
            className="w-full"
          >
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
