"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type Sheet = {
  id: string;
  name: string;
  modifiedTime?: string;
};

type SheetPickerProps = {
  sheets: Sheet[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  refreshing?: boolean;
};

export default function SheetPicker({
  sheets,
  selectedId,
  onSelect,
  onCreate,
  refreshing,
}: SheetPickerProps) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <p className="text-xs uppercase tracking-[0.35em] text-brand-200/70">
            Step 1
          </p>
          <h3 className="text-lg font-semibold text-white">
            Choose destination
          </h3>
          <p className="text-sm text-slate-400">
            Connect to an existing Google Sheet or create a fresh workbook.
          </p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={onCreate}>
          New sheet
        </Button>
      </div>

      <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        Existing sheets
      </label>
      <div className="overflow-hidden rounded-2xl border border-white/5 bg-white/5">
        <select
          value={selectedId ?? ""}
          onChange={(event) => onSelect(event.target.value)}
          className="block w-full bg-transparent px-4 py-3 text-sm text-slate-100 focus:outline-none"
        >
          <option value="" disabled>
            {refreshing ? "Loading sheets…" : "Select a Google Sheet"}
          </option>
          {sheets.map((sheet) => (
            <option
              key={sheet.id}
              value={sheet.id}
              className={cn("bg-surface-base text-slate-900")}
            >
              {sheet.name}
              {sheet.modifiedTime
                ? ` · ${new Date(sheet.modifiedTime).toLocaleDateString()}`
                : ""}
            </option>
          ))}
        </select>
      </div>
      {selectedId ? (
        <p className="text-xs text-slate-500">
          {`Target sheet ID: ${selectedId.slice(0, 8)}…`}
        </p>
      ) : null}
    </div>
  );
}
