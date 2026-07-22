/* ============================================================
   Summary Mapper (pure)
   คำนวณ "สรุปยอด" จากแถวที่ map แล้ว (ADMIN row layout) ของทุก source ใน Sheet 2
   - นับจำนวนเคสต่อผู้รับผิดชอบ / ต่อสถานะลูกค้า
   - นับเคสที่มีมัดจำ / ทำใบเสนอราคา / มีสัญญา
   - สร้างเมทริกซ์สำหรับเขียนลงแท็บ SUMMARY ของ Sheet 1
   ============================================================ */
import type { SheetSummary, SummaryMetric } from "@tracking-cyd/shared";
import { ADMIN_HEADERS } from "./sync.types";

/** index ของคอลัมน์ใน ADMIN row (อิงลำดับใน ADMIN_HEADERS) */
const COL = {
  assignee: ADMIN_HEADERS.indexOf("ผู้รับผิดชอบ"),
  quote: ADMIN_HEADERS.indexOf("ทำใบเสนอราคา"),
  customerStatus: ADMIN_HEADERS.indexOf("สถานะลูกค้า"),
  deposit: ADMIN_HEADERS.indexOf("มัดจำ"),
  draftContract: ADMIN_HEADERS.indexOf("ร่างสัญญา"),
  contractLink: ADMIN_HEADERS.indexOf("ลิงก์สัญญา"),
} as const;

export interface SourceRows {
  slug: string;
  sourceSheet: string;
  /** แถวที่ map แล้ว (ADMIN layout, ไม่รวมแถวหัว) */
  rows: string[][];
}

function cell(row: string[], idx: number): string {
  return idx < 0 ? "" : (row[idx] ?? "").toString().trim();
}

function toMetrics(counts: Map<string, number>): SummaryMetric[] {
  return [...counts.entries()]
    .map(([label, count]) => ({ key: label, label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

/** รวมแถวจากทุก source → SheetSummary (ยังไม่ผูก sources metadata / written) */
export function buildSummary(sources: SourceRows[], generatedAt: string): SheetSummary {
  const byAssignee = new Map<string, number>();
  const byStatus = new Map<string, number>();
  let totalCases = 0;
  let depositCount = 0;
  let quotedCount = 0;
  let contractCount = 0;

  for (const src of sources) {
    for (const row of src.rows) {
      totalCases++;

      const assignee = cell(row, COL.assignee) || src.sourceSheet;
      byAssignee.set(assignee, (byAssignee.get(assignee) ?? 0) + 1);

      const status = cell(row, COL.customerStatus) || "ไม่ระบุ";
      byStatus.set(status, (byStatus.get(status) ?? 0) + 1);

      if (cell(row, COL.deposit)) depositCount++;
      if (cell(row, COL.quote)) quotedCount++;
      if (cell(row, COL.contractLink) || cell(row, COL.draftContract)) contractCount++;
    }
  }

  return {
    generatedAt,
    totalCases,
    depositCount,
    quotedCount,
    contractCount,
    byAssignee: toMetrics(byAssignee),
    byCustomerStatus: toMetrics(byStatus),
    sources: [],
  };
}

/** เมทริกซ์ string[][] สำหรับเขียนลงแท็บ SUMMARY (Sheet 1) */
export function buildSummaryMatrix(summary: SheetSummary): string[][] {
  const matrix: string[][] = [];
  matrix.push(["สรุปยอด Admin (คำนวณจาก Sheet ต้นทาง)", ""]);
  matrix.push(["อัปเดตล่าสุด", summary.generatedAt]);
  matrix.push([]);

  matrix.push(["ตัวชี้วัด", "จำนวน"]);
  matrix.push(["เคสทั้งหมด", String(summary.totalCases)]);
  matrix.push(["ทำใบเสนอราคาแล้ว", String(summary.quotedCount)]);
  matrix.push(["มีมัดจำ", String(summary.depositCount)]);
  matrix.push(["มีสัญญา", String(summary.contractCount)]);
  matrix.push([]);

  matrix.push(["ผู้รับผิดชอบ", "จำนวนเคส"]);
  for (const m of summary.byAssignee) matrix.push([m.label, String(m.count)]);
  matrix.push(["รวม", String(summary.totalCases)]);
  matrix.push([]);

  matrix.push(["สถานะลูกค้า", "จำนวน"]);
  for (const m of summary.byCustomerStatus) matrix.push([m.label, String(m.count)]);

  return matrix;
}
