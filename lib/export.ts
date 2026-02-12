import * as XLSX from "xlsx";
import { Distribution, Table } from "./types";

export function exportTablesToExcel(
  tables: Table[],
  distributions: Record<string, Distribution>,
) {
  const wb = XLSX.utils.book_new();

  for (const table of tables) {
    const dists = table.distributionIds
      .map((id) => distributions[id])
      .filter(Boolean);

    if (dists.length === 0) continue;

    const header = ["Measure", ...dists.map((d) => d.name)];

    const rows = table.measureOrder.map((measureName) => {
      const row: (string | number | null)[] = [measureName];
      for (const d of dists) {
        const result = d.measures.find((m) => m.name === measureName);
        row.push(result?.error ? null : (result?.value ?? null));
      }
      return row;
    });

    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    const sheetName = table.name.slice(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  XLSX.writeFile(wb, "polarization-measures.xlsx");
}
