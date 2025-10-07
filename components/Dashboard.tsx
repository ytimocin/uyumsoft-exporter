"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import ColumnSelector from "@/components/ColumnSelector";
import SheetPicker from "@/components/SheetPicker";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useToast } from "@/components/ui/toast";
import {
  DEFAULT_COLUMNS,
  REQUIRED_KEY_COLUMN,
  SHEET_DEFAULT_TITLE,
} from "@/lib/constants";
import type { SessionUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

const COLUMN_STORAGE_KEY = "uyumsoft:columns";
const SHEET_STORAGE_KEY = "uyumsoft:sheet";
const TAB_STORAGE_KEY = "uyumsoft:tab";

export type DashboardProps = {
  user: SessionUser;
  authStatus?: string;
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

export default function Dashboard({ user, authStatus }: DashboardProps) {
  const { toast } = useToast();
  const lastAuthToast = useRef<string | null>(null);
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);
  const [sheetTab, setSheetTab] = useState<string>("Sheet1");
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] =
    useState<string[]>(DEFAULT_COLUMNS);
  const [file, setFile] = useState<File | null>(null);
  const [loadingSheets, setLoadingSheets] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [dryRun, setDryRun] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [status, setStatus] = useState<{
    type: "idle" | "error" | "success";
    message: string;
    url?: string;
  }>({ type: "idle", message: "" });

  const hasFile = useMemo(() => Boolean(file), [file]);
  const sheetOptions = sheets;

  useEffect(() => {
    if (!authStatus) {
      return;
    }
    if (lastAuthToast.current === authStatus) {
      return;
    }
    if (authStatus === "success") {
      toast({
        title: "Google account connected",
        description: "You're ready to sync Uyumsoft exports into Sheets.",
        variant: "success",
      });
    } else if (authStatus === "error") {
      toast({
        title: "Authentication failed",
        description: "Please try signing in with Google again.",
        variant: "error",
      });
    }
    lastAuthToast.current = authStatus;

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("auth");
      window.history.replaceState({}, "", url.toString());
    }
  }, [authStatus, toast]);

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
        toast({
          title: "Could not load sheets",
          description: "Check your Google connection and try again.",
          variant: "error",
        });
      } finally {
        setLoadingSheets(false);
      }
    };

    loadSheets().catch(() => {
      // handled above
    });
  }, [toast]);

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
      const columnList = Array.from(next);
      setSelectedColumns(columnList);
      localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(columnList));
      setStatus({ type: "idle", message: "", url: undefined });
      toast({
        title: "CSV ready",
        description: `${selected.name} parsed successfully.`,
        variant: "info",
      });
    } catch (error) {
      console.error("Failed to parse CSV headers", error);
      setStatus({
        type: "error",
        message: "Could not read CSV header. Please check the file.",
        url: undefined,
      });
      toast({
        title: "CSV parsing failed",
        description:
          "We couldn't read the header. Please double-check the export.",
        variant: "error",
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
      setStatus({
        type: "success",
        message: `Created sheet ${sheet.name}`,
        url: `https://docs.google.com/spreadsheets/d/${sheet.id}`,
      });
      toast({
        title: "New sheet created",
        description: sheet.name,
        variant: "success",
        actionHref: `https://docs.google.com/spreadsheets/d/${sheet.id}`,
        actionLabel: "Open sheet",
      });
    } catch (error) {
      console.error("Create sheet failed", error);
      setStatus({
        type: "error",
        message: "Could not create Google Sheet.",
        url: undefined,
      });
      toast({
        title: "Sheet creation failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "error",
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
      if (!payload.dryRun) {
        setLastSync(new Date());
        toast({
          title: "Sync complete",
          description: `Updated ${payload.rowCount} rows in ${selectedSheet?.name ?? "Google Sheet"}.`,
          variant: "success",
          actionHref: payload.sheetUrl,
          actionLabel: "Open sheet",
        });
      } else {
        toast({
          title: "Dry run complete",
          description: `${payload.rowCount} rows would be synced across ${payload.columnCount} columns.`,
          variant: "info",
        });
      }
    } catch (error) {
      console.error("Sync failed", error);
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Sync failed",
        url: undefined,
      });
      toast({
        title: "Sync failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "error",
      });
    } finally {
      setSyncing(false);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  const summaryColumns = useMemo(
    () => selectedColumns.filter((column) => column !== REQUIRED_KEY_COLUMN),
    [selectedColumns],
  );

  const selectedSheet = useMemo(
    () => sheets.find((sheet) => sheet.id === selectedSheetId) ?? null,
    [sheets, selectedSheetId],
  );

  return (
    <section className="space-y-8 pb-16">
      <div className="flex flex-col gap-6">
        <div className="inline-flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-400/30 bg-brand-500/15 text-2xl">
            🐑
          </div>
          <span className="text-sm font-semibold uppercase tracking-[0.35em] text-brand-200/80">
            Uyumsoft Exporter
          </span>
        </div>
        <SectionHeader
          title={`Welcome back, ${user.name.split(" ")[0]}`}
          description="Drop in the latest CSV, curate the dataset, and push cleaned transactions straight to Google Sheets."
          action={
            <Button variant="ghost" size="sm" onClick={logout}>
              Sign out
            </Button>
          }
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
        <Badge className="border-brand-400/40 bg-brand-500/20 text-brand-100">
          Signed in as {user.email}
        </Badge>
        {lastSync ? (
          <Badge className="bg-white/10 text-slate-200">
            Last sync {lastSync.toLocaleString()}
          </Badge>
        ) : (
          <Badge className="bg-white/10 text-slate-200">No sync yet</Badge>
        )}
        {loadingSheets ? (
          <span className="text-xs text-slate-500">Loading sheet list…</span>
        ) : null}
      </div>

      {status.message && status.type !== "idle" ? (
        <Alert
          tone={status.type === "error" ? "error" : "success"}
          message={status.message}
          action={
            status.url ? (
              <a
                href={status.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-white/90 underline decoration-brand-300/70 decoration-2 underline-offset-4"
              >
                Open sheet
              </a>
            ) : undefined
          }
        />
      ) : null}

      <div className="grid gap-6">
        <Card>
          <CardContent>
            <SheetPicker
              sheets={sheetOptions}
              selectedId={selectedSheetId}
              onSelect={setSelectedSheetId}
              onCreate={handleCreateSheet}
              refreshing={loadingSheets}
            />
            <div className="mt-6 flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Sheet tab name
              </label>
              <input
                value={sheetTab}
                onChange={(event) =>
                  setSheetTab(event.target.value || "Sheet1")
                }
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-400/60 focus:outline-none"
              />
              <p className="text-xs text-slate-500">
                Existing rows in this tab will be replaced during sync.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.35em] text-brand-200/70">
                Step 2
              </p>
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 text-center">
                <label className="flex cursor-pointer flex-col items-center gap-3">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <span className="text-base font-semibold text-white">
                    {hasFile ? file?.name : "Drop your CSV here or browse"}
                  </span>
                  <p className="text-xs text-slate-400">
                    Semicolon separated exports work best. We only read the
                    header to suggest columns automatically.
                  </p>
                </label>
                {hasFile ? (
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
                    <Badge className="bg-white/10 text-slate-200">
                      {(file?.size ?? 0) / 1024 < 1024
                        ? `${Math.round((file?.size ?? 0) / 1024)} KB`
                        : `${((file?.size ?? 0) / (1024 * 1024)).toFixed(1)} MB`}
                    </Badge>
                    <Badge className="bg-white/10 text-slate-200">
                      {availableColumns.length} detected columns
                    </Badge>
                  </div>
                ) : null}
              </div>
            </div>

            {availableColumns.length > 0 ? (
              <ColumnSelector
                available={availableColumns}
                selected={selectedColumns}
                onChange={handleColumnsChange}
              />
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.35em] text-brand-200/70">
                Step 3
              </p>
              <h3 className="text-xl font-semibold text-white">
                Review & launch sync
              </h3>
              <p className="text-sm text-slate-400">
                Confirm destination details, choose to dry run, and push the
                data. We keep updates idempotent with {REQUIRED_KEY_COLUMN} as
                the key column.
              </p>
            </div>

            <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase text-slate-400">
                  Destination sheet
                </p>
                <p className="mt-1 text-sm text-white">
                  {selectedSheet ? selectedSheet.name : "No sheet selected"}
                </p>
                <p className="text-xs text-slate-500">Tab: {sheetTab}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-400">
                  Columns ({summaryColumns.length + 1})
                </p>
                <p className="mt-1 text-sm text-white">
                  {[REQUIRED_KEY_COLUMN, ...summaryColumns].join(" · ")}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div>
                <p className="text-sm font-medium text-white">Dry run</p>
                <p className="text-xs text-slate-400">
                  Preview row & column counts without touching the sheet.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDryRun((value) => !value)}
                className={cn(
                  "relative h-6 w-12 rounded-full border border-white/15 bg-white/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300",
                  dryRun && "bg-brand-500/30 border-brand-400/50",
                )}
                aria-pressed={dryRun}
              >
                <span
                  className={cn(
                    "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition",
                    dryRun && "translate-x-6 bg-brand-400",
                  )}
                />
              </button>
            </div>

            <div className="flex flex-col gap-2 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span>
                  {status.type === "success" && status.message
                    ? status.message
                    : dryRun
                      ? "Run a dry sync to validate before pushing live."
                      : "Ready when you are."}
                </span>
                {status.type === "success" && status.url ? (
                  <a
                    href={status.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-white/90 underline decoration-brand-300/70 decoration-2 underline-offset-4"
                  >
                    Open sheet ↗
                  </a>
                ) : null}
              </div>
              <Button
                type="button"
                onClick={handleSync}
                disabled={syncing}
                size="lg"
              >
                {syncing
                  ? "Processing…"
                  : dryRun
                    ? "Run dry sync"
                    : "Sync to Google Sheets"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
