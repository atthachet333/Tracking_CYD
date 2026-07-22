/* ============================================================
   Mapper: raw values (headers + rows) → CaseRow[]
   - map ตามชื่อ header (ไทย/อังกฤษ) ไม่ผูก index
   - แปลงวันที่, progress, amount, derived status
   - เก็บ warnings เมื่อ header จำเป็นขาด
   ============================================================ */
import type { CaseRow, MappingWarning, TaskStatus } from "@tracking-cyd/shared";
import {
  buildColumnMapping, REQUIRED_FIELDS, type CanonicalField,
} from "../../config/sheet-column-map";
import { parseSheetDate, todayBangkokISO, daysBetween } from "../../lib/date";

const DONE_WORDS = ["เสร็จ", "done", "complete", "ปิด", "closed", "อนุมัติ", "สำเร็จ"];
const PROG_WORDS = ["กำลัง", "progress", "ดำเนินการ", "in progress", "wip"];

function num(v: string | undefined): number {
  if (!v) return 0;
  const n = Number(String(v).replace(/[,%\s฿]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function deriveStatus(statusText: string, dueISO: string | null, closedISO: string | null, progress: number): TaskStatus {
  const s = statusText.toLowerCase();
  if (closedISO || DONE_WORDS.some((w) => s.includes(w))) return "done";

  if (dueISO) {
    const today = todayBangkokISO();
    const diff = daysBetween(today, dueISO); // >0 = อนาคต, <0 = เลยกำหนด
    if (diff < 0) return "over";
    if (diff <= 3) return "near";
  }
  if (progress > 0 || PROG_WORDS.some((w) => s.includes(w))) return "prog";
  return "wait";
}

export function mapRowsToCases(
  headers: string[],
  rows: string[][],
): { cases: CaseRow[]; warnings: MappingWarning[]; mapping: Record<string, string | null>; unmapped: string[] } {
  const mapping = buildColumnMapping(headers);
  const headerIndex = new Map<string, number>();
  headers.forEach((h, i) => headerIndex.set(h, i));

  const idxOf = (field: CanonicalField): number => {
    const header = mapping[field];
    return header ? headerIndex.get(header) ?? -1 : -1;
  };

  const get = (row: string[], field: CanonicalField): string => {
    const i = idxOf(field);
    return i >= 0 ? (row[i] ?? "").toString().trim() : "";
  };

  const warnings: MappingWarning[] = [];
  for (const field of REQUIRED_FIELDS) {
    if (!mapping[field]) {
      warnings.push({ field, message: `ไม่พบคอลัมน์สำหรับ "${field}" ใน Google Sheet` });
    }
  }
  const unmapped = (Object.keys(mapping) as CanonicalField[]).filter((f) => !mapping[f]);

  const cases: CaseRow[] = rows
    .filter((row) => row.some((cell) => (cell ?? "").toString().trim() !== ""))
    .map((row, i) => {
      const raw: Record<string, string> = {};
      headers.forEach((h, ci) => { raw[h] = (row[ci] ?? "").toString(); });

      const dueDate = parseSheetDate(get(row, "dueDate"));
      const createdDate = parseSheetDate(get(row, "createdDate"));
      const closedDate = parseSheetDate(get(row, "closedDate"));
      const progress = Math.max(0, Math.min(100, num(get(row, "progress"))));
      const status = get(row, "status");

      return {
        caseNo: get(row, "caseNo") || `ROW-${i + 1}`,
        customerName: get(row, "customerName"),
        status,
        derivedStatus: deriveStatus(status, dueDate, closedDate, progress),
        assignee: get(row, "assignee"),
        department: get(row, "department"),
        serviceType: get(row, "serviceType"),
        documentType: get(row, "documentType"),
        dueDate,
        createdDate,
        closedDate,
        progress,
        sla: get(row, "sla"),
        amount: num(get(row, "amount")),
        raw,
      };
    });

  return { cases, warnings, mapping, unmapped };
}
