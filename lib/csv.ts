import { parse } from "csv-parse/sync";
import { CSV_DELIMITER, REQUIRED_KEY_COLUMN } from "@/lib/constants";

export type CsvRow = Record<string, string>;

export type ParsedCsv = {
  headers: string[];
  rows: CsvRow[];
};

export function parseCsv(buffer: Buffer): ParsedCsv {
  const records = parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    delimiter: CSV_DELIMITER,
    bom: true,
    trim: false,
  }) as CsvRow[];

  if (!records.length) {
    throw new Error("CSV file does not contain any rows");
  }

  const headers = Object.keys(records[0]).filter(
    (header) => header.trim().length > 0,
  );
  if (!headers.includes(REQUIRED_KEY_COLUMN)) {
    throw new Error(`CSV file must include column: ${REQUIRED_KEY_COLUMN}`);
  }

  const rows = records.map((row) => {
    const projected: CsvRow = {};
    headers.forEach((header) => {
      projected[header] = row[header] ?? "";
    });
    return projected;
  });

  return { headers, rows };
}

export function projectColumns(rows: CsvRow[], columns: string[]): CsvRow[] {
  return rows.map((row) => {
    const projected: CsvRow = {};
    for (const column of columns) {
      projected[column] = row[column] ?? "";
    }
    return projected;
  });
}

export function toSheetValues(headers: string[], rows: CsvRow[]): string[][] {
  const values: string[][] = [headers];
  rows.forEach((row) => {
    values.push(headers.map((header) => row[header] ?? ""));
  });
  return values;
}
