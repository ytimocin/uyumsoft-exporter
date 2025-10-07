import { NextRequest, NextResponse } from "next/server";
import { ensureAccessToken, overwriteSheet } from "@/lib/google";
import { requireSession } from "@/lib/auth";
import { parseCsv, projectColumns, toSheetValues } from "@/lib/csv";
import { DEFAULT_COLUMNS, REQUIRED_KEY_COLUMN } from "@/lib/constants";

export async function POST(request: NextRequest) {
  let dryRun = false;
  try {
    const user = await requireSession(request);
    const formData = await request.formData();
    const sheetId = (formData.get("sheetId") as string | null)?.trim();
    const sheetTab =
      (formData.get("sheetName") as string | null)?.trim() || "Sheet1";
    const columnsJson = formData.get("columns") as string | null;
    dryRun = (formData.get("dryRun") as string | null) === "true";
    const file = formData.get("file");

    if (!sheetId) {
      return new NextResponse("Sheet ID is required", { status: 400 });
    }

    if (!file || !(file instanceof File)) {
      return new NextResponse("CSV file is required", { status: 400 });
    }

    const selectedColumns: string[] = columnsJson
      ? JSON.parse(columnsJson)
      : DEFAULT_COLUMNS;
    if (!selectedColumns.includes(REQUIRED_KEY_COLUMN)) {
      return new NextResponse(`Columns must include ${REQUIRED_KEY_COLUMN}`, {
        status: 400,
      });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = parseCsv(buffer);

    const missingColumns = selectedColumns.filter(
      (column) => !parsed.headers.includes(column),
    );
    if (missingColumns.length > 0) {
      return NextResponse.json(
        {
          error: "Some selected columns are missing in the CSV",
          missingColumns,
        },
        { status: 400 },
      );
    }

    const projected = projectColumns(parsed.rows, selectedColumns);
    const values = toSheetValues(selectedColumns, projected);

    const token = await ensureAccessToken(user.id);

    if (!dryRun) {
      await overwriteSheet(token.accessToken, sheetId, sheetTab, values);
    }

    return NextResponse.json({
      rowCount: projected.length,
      columnCount: selectedColumns.length,
      sheetId,
      sheetTab,
      dryRun,
      columns: selectedColumns,
    });
  } catch (error) {
    console.error("Sync failed", error);
    if (error instanceof Response) {
      return error;
    }
    return new NextResponse(
      dryRun ? "Dry run failed" : "Failed to sync sheet",
      { status: 500 },
    );
  }
}
