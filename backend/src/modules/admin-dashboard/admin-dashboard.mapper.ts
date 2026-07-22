/* ============================================================
   Admin Dashboard Mapper (pure)
   - อ่านแท็บ ADMIN (ปลายทาง) → CustomerCaseItem โดย map ตาม header จริง
   - ใช้ detectHeaderRow ของ documents-header (มี alias ครบรวมผู้รับผิดชอบ)
   - จำแนกสถานะด้วย customer-status.config (กลุ่มลูกค้า)
   ============================================================ */
import type { CustomerCaseItem } from "@tracking-cyd/shared";
import { detectHeaderRow, buildMappingReport, countHeaderMatches, type DocColumnMap, type DocField } from "../documents-dashboard/documents-header.config";
import { classifyStatus, isUnknownStatus } from "../customer-dashboard/customer-status.config";

function cell(row: string[], map: DocColumnMap, field: DocField): string {
  const idx = map[field];
  return idx === undefined ? "" : (row[idx] ?? "").toString().trim();
}
function isEmptyRow(row: string[]): boolean {
  return !row || row.every((c) => (c ?? "").toString().trim() === "");
}

export interface AdminMapResult {
  cases: CustomerCaseItem[];
  headers: string[];
  unknownStatuses: string[];
  rowsRead: number;
  mapping: Record<string, string | null>;
  unmapped: string[];
  warnings: string[];
}

export function mapAdmin(values: string[][], sheetTitle: string): AdminMapResult {
  const detected = detectHeaderRow(values);
  if (!detected) {
    return { cases: [], headers: [], unknownStatuses: [], rowsRead: 0, mapping: {}, unmapped: [], warnings: [`ไม่พบแถวหัวตารางในแท็บ "${sheetTitle}"`] };
  }
  const { headerRowIndex, columnMap, headers, matchedCount } = detected;
  const { mapping, unmapped } = buildMappingReport(headers, columnMap);
  const warnings: string[] = [];
  for (const req of ["caseNo", "company", "assignee", "status"] as DocField[]) {
    if (columnMap[req] === undefined) warnings.push(`ไม่พบคอลัมน์สำหรับ "${req}" ในแท็บ ADMIN`);
  }

  const cases: CustomerCaseItem[] = [];
  const unknown = new Set<string>();
  let rowsRead = 0;

  for (let i = headerRowIndex + 1; i < values.length; i++) {
    const row = values[i] ?? [];
    rowsRead++;
    if (isEmptyRow(row)) continue;
    if (countHeaderMatches(row) >= Math.max(3, matchedCount - 1)) continue;

    const caseNo = cell(row, columnMap, "caseNo");
    const company = cell(row, columnMap, "company");
    if (!caseNo && !company) continue;

    const customerStatus = cell(row, columnMap, "status");
    if (isUnknownStatus(customerStatus)) unknown.add(customerStatus);
    const followUp1 = cell(row, columnMap, "followUp1");
    const followUp2 = cell(row, columnMap, "followUp2");
    const followUp3 = cell(row, columnMap, "followUp3");

    cases.push({
      date: cell(row, columnMap, "workDate") || null,
      caseNo,
      company,
      assignee: cell(row, columnMap, "assignee"),
      initialDetail: cell(row, columnMap, "detail"),
      quotation: cell(row, columnMap, "quotation"),
      quotationLink: cell(row, columnMap, "quotationLink"),
      followUp1, followUp2, followUp3,
      customerStatus,
      statusGroup: classifyStatus(customerStatus),
      deposit: cell(row, columnMap, "paymentStatus") || cell(row, columnMap, "deposit"),
      contractDraft: cell(row, columnMap, "contractDraft"),
      contractLink: cell(row, columnMap, "contractLink"),
      latestFollowUp: followUp3 || followUp2 || followUp1,
      sourceSheet: cell(row, columnMap, "sourceSheet") || sheetTitle,
      sourceRow: Number(cell(row, columnMap, "sourceRow")) || i + 1,
    });
  }

  if (unknown.size > 0) warnings.push(`พบสถานะลูกค้าที่ยังไม่รู้จัก ${unknown.size} ค่า: ${[...unknown].join(", ")}`);
  return { cases, headers, unknownStatuses: [...unknown], rowsRead, mapping, unmapped, warnings };
}
