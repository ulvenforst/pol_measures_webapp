"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  Row,
} from "@tanstack/react-table";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from "@dnd-kit/modifiers";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DistributionChart } from "@/components/distribution-chart";
import { useStore } from "@/lib/store";
import { computeMeasures } from "@/lib/api";
import {
  Distribution,
  Table as TableType,
  parseMeasureName,
} from "@/lib/types";
import { DEFAULT_TABLE_ID, EXPERT_CORRELATIONS } from "@/lib/default-table";
import { generateX } from "@/components/distribution-editor";
import { Trash2, GripVertical } from "lucide-react";

interface Props {
  table: TableType;
}

function valueColor(value: number | null): string {
  if (value == null || isNaN(value)) return "transparent";
  const clamped = Math.max(0, Math.min(1, value));
  return `rgba(239, 68, 68, ${clamped * 0.6})`;
}

interface MeasureRow {
  measure: string;
  [distId: string]: string | number | null;
}

function SortableRow({
  row,
  measureId,
}: {
  row: Row<MeasureRow>;
  measureId: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: measureId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {cell.column.id === "measure" ? (
            <div className="flex items-center gap-1">
              <button
                className="cursor-grab touch-none text-muted-foreground hover:text-foreground p-0.5 -ml-1"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="h-4 w-4" />
              </button>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </div>
          ) : (
            flexRender(cell.column.columnDef.cell, cell.getContext())
          )}
        </TableCell>
      ))}
    </TableRow>
  );
}

export function TableView({ table }: Props) {
  const distributions = useStore((s) => s.distributions);
  const removeFromTable = useStore((s) => s.removeFromTable);
  const reorderMeasure = useStore((s) => s.reorderMeasure);
  const saveDistribution = useStore((s) => s.saveDistribution);
  const [deleteTarget, setDeleteTarget] = useState<Distribution | null>(null);
  const backfillAttempted = useRef(new Set<string>());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor),
  );

  const dists = useMemo(
    () => table.distributionIds.map((id) => distributions[id]).filter(Boolean),
    [table.distributionIds, distributions],
  );

  useEffect(() => {
    for (const dist of dists) {
      const missingNames = table.measureOrder.filter(
        (name) => !dist.measures.some((m) => m.name === name),
      );
      const missingConfigs = missingNames
        .map((name) => ({ name, config: parseMeasureName(name) }))
        .filter(
          (
            entry,
          ): entry is {
            name: string;
            config: NonNullable<ReturnType<typeof parseMeasureName>>;
          } => entry.config !== null,
        );

      if (missingConfigs.length === 0) continue;

      const key = `${dist.id}:${missingNames.sort().join(",")}`;
      if (backfillAttempted.current.has(key)) continue;
      backfillAttempted.current.add(key);

      computeMeasures(
        dist.x,
        dist.weights,
        missingConfigs.map((e) => e.config),
      )
        .then((results) => {
          saveDistribution({
            ...dist,
            measures: [...dist.measures, ...results],
          });
        })
        .catch(() => {
          // API unavailable — leave N/A as is
        });
    }
  }, [dists, table.measureOrder, saveDistribution]);

  const data: MeasureRow[] = useMemo(() => {
    if (dists.length === 0) return [];
    return table.measureOrder.map((measureName) => {
      const row: MeasureRow = { measure: measureName };
      for (const d of dists) {
        const result = d.measures.find((m) => m.name === measureName);
        row[d.id] = result?.error ? null : (result?.value ?? null);
      }
      return row;
    });
  }, [dists, table.measureOrder]);

  const columns: ColumnDef<MeasureRow>[] = useMemo(
    () => [
      {
        accessorKey: "measure",
        header: "Measure",
        cell: ({ row }) => {
          const measureName = row.getValue("measure") as string;
          const correlation =
            table.id === DEFAULT_TABLE_ID
              ? EXPERT_CORRELATIONS[measureName]
              : undefined;
          return (
            <div className="flex-1 flex items-center justify-between gap-2">
              <span className="text-sm font-medium">{measureName}</span>
              {correlation != null && (
                <span className="text-xs text-muted-foreground/60 tabular-nums">
                  {correlation.toFixed(4)}
                </span>
              )}
            </div>
          );
        },
      },
      ...dists.map(
        (d): ColumnDef<MeasureRow> => ({
          accessorKey: d.id,
          header: () => (
            <div className="group/col space-y-1 min-w-[100px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium truncate">{d.name}</span>
                {table.id !== DEFAULT_TABLE_ID && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-muted-foreground hover:text-destructive opacity-0 group-hover/col:opacity-100 transition-opacity"
                    onClick={() => setDeleteTarget(d)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <DistributionChart
                x={generateX(d.weights.length)}
                weights={d.weights}
                compact
              />
            </div>
          ),
          cell: ({ row }) => {
            const value = row.getValue(d.id) as number | null;
            return (
              <div
                className="text-center font-mono text-sm px-2 py-1 rounded"
                style={{ backgroundColor: valueColor(value) }}
              >
                {value != null ? value.toFixed(4) : "N/A"}
              </div>
            );
          },
        }),
      ),
    ],
    [dists, table.id],
  );

  const tanstackTable = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const measureIds = useMemo(
    () => table.measureOrder.slice(),
    [table.measureOrder],
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = measureIds.indexOf(active.id as string);
    const newIndex = measureIds.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;

    reorderMeasure(table.id, oldIndex, newIndex);
  }

  if (dists.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No distributions saved yet. Save one from the calculator above.
      </p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-md border">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          onDragEnd={handleDragEnd}
        >
          <Table>
            <TableHeader>
              {tanstackTable.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <SortableContext
              items={measureIds}
              strategy={verticalListSortingStrategy}
            >
              <TableBody>
                {tanstackTable.getRowModel().rows?.length ? (
                  tanstackTable
                    .getRowModel()
                    .rows.map((row) => (
                      <SortableRow
                        key={row.id}
                        row={row}
                        measureId={measureIds[row.index]}
                      />
                    ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </SortableContext>
          </Table>
        </DndContext>
      </div>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove distribution?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove &quot;{deleteTarget?.name}&quot; from this table.
              The distribution itself won&apos;t be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline">Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (deleteTarget) {
                  removeFromTable(table.id, deleteTarget.id);
                  setDeleteTarget(null);
                }
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
