"use client";

import { useMemo } from "react";
import { DEFAULT_COLUMNS, REQUIRED_KEY_COLUMN } from "@/lib/constants";

const LABEL_OVERRIDES: Record<string, string> = {
  Gönderici: "Cari İsmi (Gönderici)",
  "Ödenecek Tutar": "Tutar (Ödenecek Tutar)",
  "Sipariş Numarası": "İrsaliye No (Sipariş Numarası)",
};

type ColumnSelectorProps = {
  available: string[];
  selected: string[];
  onChange: (next: string[]) => void;
};

export default function ColumnSelector({
  available,
  selected,
  onChange,
}: ColumnSelectorProps) {
  const sortedColumns = useMemo(() => {
    return [...available].sort((a, b) => a.localeCompare(b, "tr"));
  }, [available]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const toggleColumn = (column: string) => {
    if (column === REQUIRED_KEY_COLUMN) {
      return;
    }
    const next = new Set(selectedSet);
    if (next.has(column)) {
      next.delete(column);
    } else {
      next.add(column);
    }
    if (!next.has(REQUIRED_KEY_COLUMN)) {
      next.add(REQUIRED_KEY_COLUMN);
    }
    onChange(Array.from(next));
  };

  const resetDefaults = () => {
    const columns = available.filter((header) =>
      DEFAULT_COLUMNS.includes(header),
    );
    const next = new Set(columns.length ? columns : [REQUIRED_KEY_COLUMN]);
    next.add(REQUIRED_KEY_COLUMN);
    onChange(Array.from(next));
  };

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">
          Columns to Sync
        </h3>
        <button
          type="button"
          onClick={resetDefaults}
          className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
        >
          Reset defaults
        </button>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {sortedColumns.map((column) => {
          const label = LABEL_OVERRIDES[column] ?? column;
          const isRequired = column === REQUIRED_KEY_COLUMN;
          return (
            <label
              key={column}
              className={`flex items-center gap-2 rounded-md border border-slate-800 px-3 py-2 text-xs transition ${
                selectedSet.has(column) ? "bg-slate-800/80" : "bg-slate-950/40"
              } ${isRequired ? "ring-1 ring-emerald-500/40" : ""}`}
            >
              <input
                type="checkbox"
                checked={selectedSet.has(column)}
                onChange={() => toggleColumn(column)}
                disabled={isRequired}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-400"
              />
              <span className="text-slate-200">{label}</span>
              {isRequired && (
                <span className="text-[10px] uppercase text-emerald-400">
                  required
                </span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}
