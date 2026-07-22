/* ============================================================
   Documents Dashboard Mapper (pure)
   - อ่านค่าจากแท็บ DOCUMENTS → DocumentTaskItem[] โดย map ตาม header จริง
   - ข้ามแถวว่าง / header ซ้ำกลางชีต
   - resolve สถานะแบบ fallback: status header → quotation(step) → latest follow-up
   ============================================================ */
import type { DocumentTaskItem } from "@tracking-cyd/shared";
import {
  detectHeaderRow, buildMappingReport, countHeaderMatches, type DocColumnMap, type DocField,
} from "./documents-header.config";
import { classifyStatus, isUnknownStatus, normalizeAssignee } from "./documents-status.config";

function cell(row: string[], map: DocColumnMap, field: DocField): string {
  const idx = map[field];
  return idx === undefined ? "" : (row[idx] ?? "").toString().trim();
}

function isEmptyRow(row: string[]): boolean {
  return !row || row.every((c) => (c ?? "").toString().trim() === "");
}

export interface DocMapResult {
  items: DocumentTaskItem[];
  headers: string[];
  statusHeader: string | null;
  unknownStatuses: string[];
  rowsRead: number;
  mapping: Record<string, string | null>;
  unmapped: string[];
  warnings: string[];
}

/**
 * resolve ค่าสถานะของหนึ่งแถว:
 * 1) คอลัมน์ status (ถ้ามีค่า) 2) quotation/ขั้นตอน 3) ติดตามล่าสุด
 * คืน { value, sourceField }
 */
function resolveStatus(row: string[], map: DocColumnMap): { value: string; from: DocField | null } {
  const status = cell(row, map, "status");
  if (status) return { value: status, from: "status" };
  const quotation = cell(row, map, "quotation");
  if (quotation) return { value: quotation, from: "quotation" };
  const follow = cell(row, map, "followUp3") || cell(row, map, "followUp2") || cell(row, map, "followUp1");
  if (follow) return { value: follow, from: "followUp3" };
  return { value: "", from: null };
}

export function mapDocuments(values: string[][], sheetTitle: string): DocMapResult {
  const detected = detectHeaderRow(values);
  const warnings: string[] = [];

  if (!detected) {
    return {
      items: [], headers: [], statusHeader: null, unknownStatuses: [], rowsRead: 0,
      mapping: {}, unmapped: [], warnings: [`ไม่พบแถวหัวตารางในแท็บ "${sheetTitle}"`],
    };
  }

  const { headerRowIndex, columnMap, headers, matchedCount } = detected;
  const { mapping, unmapped } = buildMappingReport(headers, columnMap);

  for (const req of ["caseNo", "company", "assignee", "status"] as DocField[]) {
    if (columnMap[req] === undefined) warnings.push(`ไม่พบคอลัมน์สำหรับ "${req}" ในแท็บ DOCUMENTS`);
  }

  const items: DocumentTaskItem[] = [];
  const unknown = new Set<string>();
  const statusFroms = new Set<string>();
  let rowsRead = 0;

  for (let i = headerRowIndex + 1; i < values.length; i++) {
    const row = values[i] ?? [];
    rowsRead++;
    if (isEmptyRow(row)) continue;
    if (countHeaderMatches(row) >= Math.max(3, matchedCount - 1)) continue; // header ซ้ำ

    const caseNo = cell(row, columnMap, "caseNo");
    const company = cell(row, columnMap, "company");
    if (!caseNo && !company) continue; // แถวไม่ถูกต้อง

    const { value: actualStatus, from } = resolveStatus(row, columnMap);
    if (from) statusFroms.add(from);
    if (isUnknownStatus(actualStatus)) unknown.add(actualStatus);

    const followUp1 = cell(row, columnMap, "followUp1");
    const followUp2 = cell(row, columnMap, "followUp2");
    const followUp3 = cell(row, columnMap, "followUp3");

    items.push({
      workDate: cell(row, columnMap, "workDate") || null,
      caseNo,
      company,
      assignee: normalizeAssignee(cell(row, columnMap, "assignee")),
      detail: cell(row, columnMap, "detail"),
      actualStatus,
      statusGroup: classifyStatus(actualStatus),
      latestFollowUp: followUp3 || followUp2 || followUp1,
      quotationLink: cell(row, columnMap, "quotationLink"),
      contractLink: cell(row, columnMap, "contractLink"),
      sourceSheet: cell(row, columnMap, "sourceSheet") || sheetTitle,
      sourceRow: Number(cell(row, columnMap, "sourceRow")) || i + 1,
    });
  }

  // header ที่ใช้จำแนกสถานะจริง
  let statusHeader: string | null = null;
  if (statusFroms.has("status") && columnMap.status !== undefined) statusHeader = headers[columnMap.status] ?? null;
  else if (statusFroms.has("quotation") && columnMap.quotation !== undefined) {
    statusHeader = headers[columnMap.quotation] ?? null;
    warnings.push(`คอลัมน์สถานะหลักว่าง — ใช้ "${statusHeader}" เป็นสถานะ/ขั้นตอนแทน`);
  } else if (statusFroms.has("followUp3")) {
    statusHeader = "ติดตามล่าสุด";
    warnings.push(`คอลัมน์สถานะว่าง — ใช้ "ติดตามล่าสุด" เป็นสถานะแทน`);
  }

  if (unknown.size > 0) {
    warnings.push(`พบสถานะที่ยังไม่รู้จัก ${unknown.size} ค่า: ${[...unknown].join(", ")} — จัดเป็น "ยังไม่ระบุสถานะ"`);
  }

  return { items, headers, statusHeader, unknownStatuses: [...unknown], rowsRead, mapping, unmapped, warnings };
}
