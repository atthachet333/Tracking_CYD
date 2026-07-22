/* ============================================================
   Internal types สำหรับ integration layer
   ============================================================ */
import type { SheetMetadata, CaseRow, MappingWarning } from "@tracking-cyd/shared";

export type { SheetMetadata, CaseRow, MappingWarning };

/** ผลลัพธ์ดิบจากการอ่านค่า (ก่อน map) */
export interface RawSheetValues {
  sheetTitle: string;
  sheetId: number;
  headers: string[];
  rows: string[][];
}

/** ผลลัพธ์หลัง map เป็น CaseRow แล้ว พร้อม warnings */
export interface MappedCases {
  sheetTitle: string;
  sheetId: number;
  headers: string[];
  cases: CaseRow[];
  warnings: MappingWarning[];
  mapping: Record<string, string | null>;
  unmapped: string[];
}
