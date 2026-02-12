import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Distribution, MeasureConfig, Table } from "./types";
import {
  DEFAULT_TABLE_ID,
  DEFAULT_TABLE,
  DEFAULT_DISTRIBUTIONS,
} from "./default-table";

const DEFAULT_MEASURES: MeasureConfig[] = [
  { type: "EstebanRay", params: { alpha: 0.8 } },
  { type: "BiPol", params: {} },
  { type: "MECNormalized", params: { alpha: 2, beta: 1.15 } },
  { type: "EMD", params: {} },
  { type: "Shannon", params: {} },
  { type: "VanDerEijk", params: {} },
  { type: "Experts", params: {} },
];

interface AppState {
  activeMeasures: MeasureConfig[];
  distributions: Record<string, Distribution>;
  tables: Table[];

  setActiveMeasures: (measures: MeasureConfig[]) => void;
  saveDistribution: (dist: Distribution) => void;
  addTable: (name: string) => Table;
  removeTable: (tableId: string) => void;
  addToTable: (tableId: string, distId: string) => boolean;
  removeFromTable: (tableId: string, distId: string) => void;
  reorderMeasure: (tableId: string, fromIdx: number, toIdx: number) => void;
  reorderDistribution: (
    tableId: string,
    fromIdx: number,
    toIdx: number,
  ) => void;
  addMeasureNames: (tableId: string, names: string[]) => void;
}

const DEFAULT_DIST_IDS = new Set(Object.keys(DEFAULT_DISTRIBUTIONS));

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      activeMeasures: DEFAULT_MEASURES,
      distributions: { ...DEFAULT_DISTRIBUTIONS },
      tables: [DEFAULT_TABLE],

      setActiveMeasures: (measures) => set({ activeMeasures: measures }),

      saveDistribution: (dist) =>
        set((state) => ({
          distributions: { ...state.distributions, [dist.id]: dist },
        })),

      addTable: (name) => {
        const table: Table = {
          id: crypto.randomUUID(),
          name,
          distributionIds: [],
          measureOrder: [],
        };
        set((s) => ({ tables: [...s.tables, table] }));
        return table;
      },

      removeTable: (tableId) => {
        if (tableId === DEFAULT_TABLE_ID) return;
        set((state) => ({
          tables: state.tables.filter((t) => t.id !== tableId),
        }));
      },

      addToTable: (tableId, distId) => {
        const state = get();
        const table = state.tables.find((t) => t.id === tableId);
        if (!table || table.distributionIds.includes(distId)) return false;

        const dist = state.distributions[distId];
        if (dist) {
          const existingNames = new Set(table.measureOrder);
          const newNames = dist.measures
            .map((m) => m.name)
            .filter((n) => !existingNames.has(n));

          if (newNames.length > 0) {
            set((s) => ({
              tables: s.tables.map((t) =>
                t.id === tableId
                  ? {
                      ...t,
                      distributionIds: [...t.distributionIds, distId],
                      measureOrder: [...t.measureOrder, ...newNames],
                    }
                  : t,
              ),
            }));
            return true;
          }
        }

        set((s) => ({
          tables: s.tables.map((t) =>
            t.id === tableId
              ? { ...t, distributionIds: [...t.distributionIds, distId] }
              : t,
          ),
        }));
        return true;
      },

      removeFromTable: (tableId, distId) =>
        set((state) => ({
          tables: state.tables.map((t) =>
            t.id === tableId
              ? {
                  ...t,
                  distributionIds: t.distributionIds.filter(
                    (id) => id !== distId,
                  ),
                }
              : t,
          ),
        })),

      addMeasureNames: (tableId, names) =>
        set((state) => ({
          tables: state.tables.map((t) => {
            if (t.id !== tableId) return t;
            const existing = new Set(t.measureOrder);
            const toAdd = names.filter((n) => !existing.has(n));
            if (toAdd.length === 0) return t;
            return { ...t, measureOrder: [...t.measureOrder, ...toAdd] };
          }),
        })),

      reorderMeasure: (tableId, fromIdx, toIdx) =>
        set((state) => ({
          tables: state.tables.map((t) => {
            if (t.id !== tableId) return t;
            const order = [...t.measureOrder];
            const [item] = order.splice(fromIdx, 1);
            order.splice(toIdx, 0, item);
            return { ...t, measureOrder: order };
          }),
        })),

      reorderDistribution: (tableId, fromIdx, toIdx) =>
        set((state) => ({
          tables: state.tables.map((t) => {
            if (t.id !== tableId) return t;
            const ids = [...t.distributionIds];
            const [item] = ids.splice(fromIdx, 1);
            ids.splice(toIdx, 0, item);
            return { ...t, distributionIds: ids };
          }),
        })),
    }),
    {
      name: "pol-measures-storage",

      // Only persist user-created data (exclude default distributions and
      // functions, which are not serializable).
      partialize: (state) => ({
        activeMeasures: state.activeMeasures,
        distributions: Object.fromEntries(
          Object.entries(state.distributions).filter(
            ([id]) => !DEFAULT_DIST_IDS.has(id),
          ),
        ),
        tables: state.tables.filter((t) => t.id !== DEFAULT_TABLE_ID),
      }),

      // Merge persisted user data back with the always-fresh defaults.
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as Partial<AppState>;

        const userDistributions = persisted.distributions ?? {};
        const userTables = persisted.tables ?? [];

        return {
          ...currentState,
          activeMeasures:
            persisted.activeMeasures ?? currentState.activeMeasures,
          distributions: {
            ...DEFAULT_DISTRIBUTIONS,
            ...userDistributions,
          },
          tables: [DEFAULT_TABLE, ...userTables],
        };
      },
    },
  ),
);
