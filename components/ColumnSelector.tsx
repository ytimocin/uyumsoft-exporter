"use client";

import { useMemo } from "react";
import { DEFAULT_COLUMNS, REQUIRED_KEY_COLUMN } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

const LABEL_OVERRIDES: Record<string, string> = {
  Gönderici: "Cari İsmi",
  "Ödenecek Tutar": "Ödenecek Tutar",
  "Sipariş Numarası": "İrsaliye No",
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
  const sortedColumns = useMemo(
    () => [...available].sort((a, b) => a.localeCompare(b, "tr")),
    [available],
  );

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
    const defaults = available.filter((header) =>
      DEFAULT_COLUMNS.includes(header),
    );
    const next = new Set(defaults.length ? defaults : [REQUIRED_KEY_COLUMN]);
    next.add(REQUIRED_KEY_COLUMN);
    onChange(Array.from(next));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <p className="text-xs uppercase tracking-[0.35em] text-brand-200/70">
            Step 2
          </p>
          <h3 className="text-lg font-semibold text-white">Select columns</h3>
          <p className="text-sm text-slate-400">
            Keep the fields your team needs in Google Sheets. The{" "}
            {REQUIRED_KEY_COLUMN} column stays locked so updates remain
            idempotent.
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={resetDefaults}>
          Reset defaults
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {sortedColumns.map((column) => {
          const label = LABEL_OVERRIDES[column] ?? column;
          const isActive = selectedSet.has(column);
          const isRequired = column === REQUIRED_KEY_COLUMN;
          return (
            <button
              key={column}
              type="button"
              onClick={() => toggleColumn(column)}
              disabled={isRequired}
              className={cn(
                "group flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition",
                isActive
                  ? "border-brand-400/60 bg-brand-500/15 text-white shadow-lg shadow-brand-500/20"
                  : "border-white/10 bg-white/5 text-slate-300 hover:border-brand-400/40 hover:text-white",
                isRequired &&
                  "cursor-not-allowed border-brand-400/70 bg-brand-500/20 text-white",
              )}
            >
              <span>{label}</span>
              {isRequired ? (
                <Badge className="bg-brand-500/20 text-brand-100">
                  Required
                </Badge>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
