/* ============================================================
   Admin Sheet Mapper (pure)
   แปลงข้อมูลต้นทาง (เช่น แท็บ "พี่คิม") → แถวสำหรับแท็บ ADMIN
   - map ตามชื่อหัวคอลัมน์ (ผ่าน header-detector)
   - ข้ามแถวว่าง / แถวหัวซ้ำ / แถวไม่ถูกต้อง
   - สร้าง source_sheet / source_row / source_record_id / synced_at
   ============================================================ */
import { ADMIN_HEADERS, type SourceField, type SourceColumnMap, type MapResult } from "./sync.types";
import { detectHeaderRow, countHeaderMatches } from "./header-detector";

function cellAt(row: string[], map: SourceColumnMap, field: SourceField): string {
  const idx = map[field];
  return idx === undefined ? "" : (row[idx] ?? "").toString().trim();
}

function isEmptyRow(row: string[]): boolean {
  return !row || row.every((c) => (c ?? "").toString().trim() === "");
}

/**
 * @param values   ค่าทั้งหมดจากแท็บต้นทาง (รวมแถวหัว)
 * @param sourceSheet ชื่อแท็บต้นทาง (เช่น "พี่คิม")
 * @param assignee ผู้รับผิดชอบ (เช่น "พี่คิม")
 * @param syncedAt เวลา sync (ISO)
 */
export function mapSourceToAdmin(
  values: string[][],
  sourceSheet: string,
  assignee: string,
  syncedAt: string,
): MapResult {
  const detected = detectHeaderRow(values);
  if (!detected) {
    throw new Error(`ไม่พบแถวหัวตารางในแท็บ "${sourceSheet}"`);
  }
  const { headerRowIndex, columnMap, matchedCount } = detected;

  const adminRows: string[][] = [];
  const seenCaseNo = new Map<string, number>();
  let emptyRowsSkipped = 0;
  let repeatedHeadersSkipped = 0;
  let invalidRowsSkipped = 0;
  let duplicateRows = 0;
  let rowsRead = 0;

  for (let i = headerRowIndex + 1; i < values.length; i++) {
    const row = values[i] ?? [];
    rowsRead++;
    const sheetRowNumber = i + 1; // เลขแถวจริงใน Google Sheet (1-based)

    if (isEmptyRow(row)) {
      emptyRowsSkipped++;
      continue;
    }
    // แถวหัวซ้ำกลางชีต (match หัวเท่ากับ/ใกล้เคียงแถวหัวหลัก)
    if (countHeaderMatches(row) >= Math.max(3, matchedCount - 1)) {
      repeatedHeadersSkipped++;
      continue;
    }

    const caseNo = cellAt(row, columnMap, "caseNo");
    const company = cellAt(row, columnMap, "company");

    // แถวไม่ถูกต้อง: ไม่มีทั้งรหัสเคสและชื่อบริษัท
    if (!caseNo && !company) {
      invalidRowsSkipped++;
      continue;
    }

    // source_record_id
    let recordId: string;
    if (caseNo) {
      const prev = seenCaseNo.get(caseNo) ?? 0;
      if (prev > 0) {
        duplicateRows++;
        recordId = `${sourceSheet}::${caseNo}::ROW-${sheetRowNumber}`;
      } else {
        recordId = `${sourceSheet}::${caseNo}`;
      }
      seenCaseNo.set(caseNo, prev + 1);
    } else {
      recordId = `${sourceSheet}::ROW-${sheetRowNumber}`;
    }

    // เรียงตาม ADMIN_HEADERS
    const adminRow = [
      cellAt(row, columnMap, "date"),
      caseNo,
      assignee,
      company,
      cellAt(row, columnMap, "prelim"),
      cellAt(row, columnMap, "quote"),
      cellAt(row, columnMap, "quoteLink"),
      cellAt(row, columnMap, "follow1"),
      cellAt(row, columnMap, "follow2"),
      cellAt(row, columnMap, "follow3"),
      cellAt(row, columnMap, "customerStatus"),
      cellAt(row, columnMap, "deposit"),
      cellAt(row, columnMap, "draftContract"),
      cellAt(row, columnMap, "contractLink"),
      sourceSheet,
      String(sheetRowNumber),
      recordId,
      syncedAt,
    ];
    adminRows.push(adminRow);
  }

  return {
    adminRows,
    rowsRead,
    rowsWritten: adminRows.length,
    emptyRowsSkipped,
    repeatedHeadersSkipped,
    invalidRowsSkipped,
    duplicateRows,
    warnings: [],
  };
}

/** สร้างเมทริกซ์ ADMIN ใหม่: header + แถวของ source_sheet อื่น (คงไว้) + แถวใหม่ */
export function buildAdminMatrix(existing: string[][], newRows: string[][], sourceSheet: string): string[][] {
  const headerRowIndex = existing.findIndex((r) => r.some((c) => (c ?? "").toString().trim() === "source_sheet"));
  const header = [...ADMIN_HEADERS];

  let kept: string[][] = [];
  if (headerRowIndex >= 0) {
    const srcCol = existing[headerRowIndex].findIndex((c) => (c ?? "").toString().trim() === "source_sheet");
    kept = existing
      .slice(headerRowIndex + 1)
      .filter((r) => r && r.some((c) => (c ?? "").toString().trim() !== ""))
      .filter((r) => (r[srcCol] ?? "").toString().trim() !== sourceSheet);
  }

  return [header, ...kept, ...newRows];
}
