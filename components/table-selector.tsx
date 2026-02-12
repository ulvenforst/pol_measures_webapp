"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useStore } from "@/lib/store";
import { DEFAULT_TABLE_ID } from "@/lib/default-table";
import { Table } from "@/lib/types";
import { Trash2 } from "lucide-react";

interface Props {
  activeTableId: string | null;
  onSelect: (tableId: string) => void;
}

export function TableSelector({ activeTableId, onSelect }: Props) {
  const { tables, addTable, removeTable } = useStore();
  const [newName, setNewName] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Table | null>(null);

  const handleCreate = () => {
    if (!newName.trim()) return;
    const table = addTable(newName.trim());
    onSelect(table.id);
    setNewName("");
    setShowInput(false);
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
      <div className="flex items-center gap-2 flex-wrap">
        {tables.length > 0 && (
          <Tabs value={activeTableId ?? undefined} onValueChange={onSelect}>
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
          </Tabs>
        )}

        {showInput ? (
          <div className="flex items-center gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Table name"
              className="h-8 w-40"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <Button size="sm" onClick={handleCreate}>
              Create
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowInput(false)}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowInput(true)}
          >
            + New Table
          </Button>
        )}
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
