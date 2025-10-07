"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import ColumnSelector from "@/components/ColumnSelector";
import SheetPicker from "@/components/SheetPicker";
import type { SessionUser } from "@/lib/auth";
import {
  DEFAULT_COLUMNS,
  REQUIRED_KEY_COLUMN,
  SHEET_DEFAULT_TITLE,
} from "@/lib/constants";

const COLUMN_STORAGE_KEY = "uyumsoft:columns";
const SHEET_STORAGE_KEY = "uyumsoft:sheet";
const TAB_STORAGE_KEY = "uyumsoft:tab";

export type DashboardProps = {
  user: SessionUser;
};

type Sheet = {
  id: string;
  name: string;
  modifiedTime?: string;
};

type SyncResponse = {
  rowCount: number;
  columnCount: number;
  sheetId: string;
  sheetTab: string;
  dryRun: boolean;
  columns: string[];
  sheetUrl?: string;
};

export default function Dashboard({ user }: DashboardProps) {
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] =
    useState<string[]>(DEFAULT_COLUMNS);
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);
  const [sheetTab, setSheetTab] = useState<string>("Sheet1");
  const [file, setFile] = useState<File | null>(null);
  const [loadingSheets, setLoadingSheets] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [dryRun, setDryRun] = useState<boolean>(false);
  const [status, setStatus] = useState<{
    type: "idle" | "error" | "success";
    message: string;
    url?: string;
  }>({ type: "idle", message: "", url: undefined });

  const hasFile = useMemo(() => Boolean(file), [file]);

  useEffect(() => {
    try {
      const storedColumns = localStorage.getItem(COLUMN_STORAGE_KEY);
      if (storedColumns) {
        const parsed = JSON.parse(storedColumns) as string[];
        if (Array.isArray(parsed) && parsed.length) {
          setSelectedColumns(
            Array.from(new Set([...parsed, REQUIRED_KEY_COLUMN])),
          );
        }
      }
      const storedSheet = localStorage.getItem(SHEET_STORAGE_KEY);
      if (storedSheet) {
        setSelectedSheetId(storedSheet);
      }
      const storedTab = localStorage.getItem(TAB_STORAGE_KEY);
      if (storedTab) {
        setSheetTab(storedTab);
      }
    } catch (error) {
      console.warn("Failed to restore preferences", error);
    }
  }, []);

  useEffect(() => {
    const loadSheets = async () => {
      try {
        setLoadingSheets(true);
        const response = await fetch("/api/sheets");
        if (!response.ok) {
          throw new Error(await response.text());
        }
        const data = (await response.json()) as { sheets: Sheet[] };
        setSheets(data.sheets);
        setSelectedSheetId((prev) => prev ?? data.sheets[0]?.id ?? null);
      } catch (error) {
        console.error("Failed to fetch sheets", error);
        setStatus({
          type: "error",
          message: "Failed to load Google Sheets list.",
          url: undefined,
        });
      } finally {
        setLoadingSheets(false);
      }
    };

    loadSheets().catch(() => {
      // already handled
    });
  }, []);

  useEffect(() => {
    if (selectedSheetId) {
      localStorage.setItem(SHEET_STORAGE_KEY, selectedSheetId);
    }
  }, [selectedSheetId]);

  useEffect(() => {
    localStorage.setItem(TAB_STORAGE_KEY, sheetTab);
  }, [sheetTab]);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) {
      setFile(null);
      setAvailableColumns([]);
      return;
    }

    setFile(selected);
    try {
      const text = await selected.text();
      const headerLine = text.split(/\r?\n/)[0] ?? "";
      const headers = Array.from(
        new Set(
          headerLine
            .split(";")
            .map((value) => value.replace(/^\ufeff/, "").trim())
            .filter((value) => value.length > 0),
        ),
      );

      setAvailableColumns(headers);
      const defaults = headers.filter((header) =>
        DEFAULT_COLUMNS.includes(header),
      );
      const next = new Set(defaults.length ? defaults : [REQUIRED_KEY_COLUMN]);
      next.add(REQUIRED_KEY_COLUMN);
      setSelectedColumns(Array.from(next));
      localStorage.setItem(
        COLUMN_STORAGE_KEY,
        JSON.stringify(Array.from(next)),
      );
      setStatus({ type: "idle", message: "", url: undefined });
    } catch (error) {
      console.error("Failed to parse CSV headers", error);
      setStatus({
        type: "error",
        message: "Could not read CSV header. Please check the file.",
        url: undefined,
      });
    }
  };

  const handleColumnsChange = (columns: string[]) => {
    const unique = Array.from(new Set([...columns, REQUIRED_KEY_COLUMN]));
    setSelectedColumns(unique);
    localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(unique));
  };

  const handleCreateSheet = async () => {
    const title = window.prompt(
      "Name for the new Google Sheet",
      `${SHEET_DEFAULT_TITLE} ${new Date().getFullYear()}`,
    );
    if (!title) {
      return;
    }
    try {
      setLoadingSheets(true);
      const response = await fetch("/api/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const sheet = (await response.json()) as Sheet;
      setSheets((prev) => [sheet, ...prev]);
      setSelectedSheetId(sheet.id);
      localStorage.setItem(SHEET_STORAGE_KEY, sheet.id);
      const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheet.id}`;
      setStatus({
        type: "success",
        message: `Created sheet ${sheet.name}`,
        url: sheetUrl,
      });
    } catch (error) {
      console.error("Create sheet failed", error);
      setStatus({
        type: "error",
        message: "Could not create Google Sheet.",
        url: undefined,
      });
    } finally {
      setLoadingSheets(false);
    }
  };

  const handleSync = async () => {
    if (!file) {
      setStatus({
        type: "error",
        message: "Upload a CSV export first.",
        url: undefined,
      });
      return;
    }
    if (!selectedSheetId) {
      setStatus({
        type: "error",
        message: "Select or create a Google Sheet.",
        url: undefined,
      });
      return;
    }
    if (!selectedColumns.length) {
      setStatus({
        type: "error",
        message: "Choose at least one column.",
        url: undefined,
      });
      return;
    }
    if (!availableColumns.length) {
      setStatus({
        type: "error",
        message: "Could not detect columns from the CSV.",
        url: undefined,
      });
      return;
    }

    try {
      setSyncing(true);
      setStatus({ type: "idle", message: "", url: undefined });
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sheetId", selectedSheetId);
      formData.append("sheetName", sheetTab);
      formData.append("dryRun", dryRun ? "true" : "false");
      formData.append("columns", JSON.stringify(selectedColumns));

      const response = await fetch("/api/sync", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const payload = (await response.json()) as SyncResponse;
      setStatus({
        type: "success",
        message: `${payload.dryRun ? "Dry-run" : "Sync"} ready: ${payload.rowCount} rows, ${payload.columnCount} columns.`,
        url: payload.dryRun ? undefined : payload.sheetUrl,
      });
    } catch (error) {
      console.error("Sync failed", error);
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Sync failed",
        url: undefined,
      });
    } finally {
      setSyncing(false);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  return (
    <section className="space-y-6">
      <header className="rounded-xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Signed in
            </p>
            <h2 className="text-lg font-semibold text-emerald-400">
              {user.name}
            </h2>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="self-start rounded-md border border-slate-700 px-3 py-1 text-xs font-medium text-slate-300 hover:bg-slate-800"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <SheetPicker
          sheets={sheets}
          selectedId={selectedSheetId}
          onSelect={setSelectedSheetId}
          onCreate={handleCreateSheet}
          refreshing={loadingSheets}
        />
        <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
          <h3 className="text-sm font-semibold text-slate-200">
            Sheet tab name
          </h3>
          <input
            value={sheetTab}
            onChange={(event) => setSheetTab(event.target.value || "Sheet1")}
            className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none"
          />
          <p className="mt-2 text-xs text-slate-400">
            Existing data in this tab will be replaced each sync.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
        <h3 className="text-sm font-semibold text-slate-200">Source CSV</h3>
        <label className="mt-3 flex h-32 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-950/50 transition hover:border-emerald-500">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <span className="text-sm text-slate-200">
            {hasFile ? file?.name : "Drop CSV here or click to browse"}
          </span>
          <span className="mt-1 text-xs text-slate-500">
            Semicolon-separated Uyumsoft export
          </span>
        </label>
      </div>

      {availableColumns.length > 0 && (
        <ColumnSelector
          available={availableColumns}
          selected={selectedColumns}
          onChange={handleColumnsChange}
        />
      )}

      <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Dry run</h3>
            <p className="text-xs text-slate-400">
              Preview counts without changing the sheet.
            </p>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-3">
            <span className="text-xs text-slate-300">
              {dryRun ? "On" : "Off"}
            </span>
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(event) => setDryRun(event.target.checked)}
              className="h-5 w-5 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-400"
            />
          </label>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-400">
          {status.message && (
            <div className="flex items-center gap-3">
              <span
                className={
                  status.type === "error" ? "text-red-400" : "text-emerald-400"
                }
              >
                {status.message}
              </span>
              {status.url && status.type === "success" && !dryRun && (
                <a
                  href={status.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-emerald-300 hover:text-emerald-200"
                >
                  Open sheet ↗
                </a>
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleSync}
          disabled={syncing}
          className="rounded-md bg-emerald-500 px-6 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-70"
        >
          {syncing
            ? "Processing…"
            : dryRun
              ? "Run dry sync"
              : "Sync to Google Sheets"}
        </button>
      </div>
    </section>
  );
}
