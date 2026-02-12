"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { DEFAULT_TABLE_ID } from "@/lib/default-table";
import { Table } from "@/lib/types";
import { exportTablesToExcel } from "@/lib/export";
import { Trash2, Plus, Download } from "lucide-react";

interface Props {
  activeTableId: string | null;
  onSelect: (tableId: string) => void;
}

export function TableSelector({ activeTableId, onSelect }: Props) {
  const { tables, addTable, removeTable, distributions } = useStore();
  const [newName, setNewName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Table | null>(null);

  const handleCreate = () => {
    if (!newName.trim()) return;
    const table = addTable(newName.trim());
    onSelect(table.id);
    setNewName("");
    setDialogOpen(false);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    removeTable(deleteTarget.id);
    if (activeTableId === deleteTarget.id) {
      const remaining = tables.filter((t) => t.id !== deleteTarget.id);
      if (remaining.length > 0) onSelect(remaining[0].id);
    }
    setDeleteTarget(null);
  };

  return (
    <>
      <div className="flex items-center gap-2 w-full min-w-0">
        {tables.length > 0 && (
          <Tabs
            value={activeTableId ?? undefined}
            onValueChange={onSelect}
            className="min-w-0 flex-1"
          >
            <ScrollArea className="w-full whitespace-nowrap [&>[data-slot=scroll-area-viewport]]:!overflow-y-hidden [&>[data-slot=scroll-area-scrollbar][data-orientation=vertical]]:hidden">
              <TabsList>
                {tables.map((t) => (
                  <TabsTrigger key={t.id} value={t.id} className="gap-1">
                    {t.name}
                    {t.id !== DEFAULT_TABLE_ID && (
                      <span
                        role="button"
                        className="ml-1 text-muted-foreground hover:text-destructive text-xs cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setDeleteTarget(t);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </Tabs>
        )}

        <Button
          variant="outline"
          size="icon"
          className="shrink-0"
          onClick={() => exportTablesToExcel(tables, distributions)}
        >
          <Download />
        </Button>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0">
              <Plus />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreate();
              }}
            >
              <DialogHeader>
                <DialogTitle>New Table</DialogTitle>
                <DialogDescription>
                  Create a new table to organize and compare distributions.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Table name"
                  autoFocus
                />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={!newName.trim()}>
                  Create
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete table?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the table &quot;{deleteTarget?.name}
              &quot; and all its distribution references.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline">Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
