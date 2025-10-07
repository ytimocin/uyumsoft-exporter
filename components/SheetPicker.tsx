"use client";

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
    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">
          Destination Sheet
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCreate}
            className="rounded-md border border-emerald-500 px-3 py-1 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/10"
          >
            New sheet
          </button>
        </div>
      </div>
      <select
        value={selectedId ?? ""}
        onChange={(event) => onSelect(event.target.value)}
        className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none"
      >
        <option value="" disabled>
          {refreshing ? "Loading sheets..." : "Select a Google Sheet"}
        </option>
        {sheets.map((sheet) => (
          <option key={sheet.id} value={sheet.id}>
            {sheet.name}
            {sheet.modifiedTime
              ? ` · ${new Date(sheet.modifiedTime).toLocaleDateString()}`
              : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
