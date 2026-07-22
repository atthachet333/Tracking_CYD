/* ============================================================
   Types + constants สำหรับระบบ sync ต้นทาง → ปลายทาง (ADMIN)
   ============================================================ */

/** หัวคอลัมน์ของแท็บ ADMIN (ปลายทาง) ตามลำดับ */
export const ADMIN_HEADERS = [
  "วันที่",
  "รหัสเคส",
  "ผู้รับผิดชอบ",
  "ชื่อบริษัท",
  "รายละเอียดเบื้องต้น",
  "ทำใบเสนอราคา",
  "ลิงก์ใบเสนอราคา",
  "ติดตามรอบ 1",
  "ติดตามรอบ 2",
  "ติดตามรอบ 3",
  "สถานะลูกค้า",
  "มัดจำ",
  "ร่างสัญญา",
  "ลิงก์สัญญา",
  "source_sheet",
  "source_row",
  "source_record_id",
  "synced_at",
] as const;

export type AdminHeader = (typeof ADMIN_HEADERS)[number];

/** ฟิลด์มาตรฐานของต้นทาง (canonical) */
export type SourceField =
  | "date"
  | "caseNo"
  | "company"
  | "prelim"
  | "quote"
  | "quoteLink"
  | "follow1"
  | "follow2"
  | "follow3"
  | "customerStatus"
  | "deposit"
  | "draftContract"
  | "contractLink";

/** column map: canonical field → index ในแถวต้นทาง */
export type SourceColumnMap = Partial<Record<SourceField, number>>;

export interface DetectedHeader {
  headerRowIndex: number;
  columnMap: SourceColumnMap;
  matchedCount: number;
}

export interface MapStats {
  rowsRead: number;
  rowsWritten: number;
  emptyRowsSkipped: number;
  repeatedHeadersSkipped: number;
  invalidRowsSkipped: number;
  duplicateRows: number;
}

export interface MapResult extends MapStats {
  adminRows: string[][]; // เรียงตาม ADMIN_HEADERS (ไม่รวมแถวหัว)
  warnings: string[];
}
