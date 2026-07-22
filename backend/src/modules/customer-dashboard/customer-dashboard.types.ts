/* ============================================================
   Customer Dashboard · internal types
   ============================================================ */
import type { CustomerCaseItem } from "@tracking-cyd/shared";

/** ผลรวมที่คำนวณจากชีต (เก็บใน cache) ก่อนแปลงเป็น response แต่ละ endpoint */
export interface CustomerDataset {
  cases: CustomerCaseItem[];
  /** ค่าสถานะดิบที่ไม่รู้จัก (สำหรับ warning) */
  unknownStatuses: string[];
  /** แท็บที่นำมารวมจริง */
  tabsAggregated: string[];
  /** ชื่อแท็บของ gid ที่ตั้งค่าไว้ (traceability) */
  configuredTabTitle: string | null;
  rowsRead: number;
  warnings: string[];
  generatedAt: string;
}
