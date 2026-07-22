/* ============================================================
   Header Detector (pure)
   - หา "แถวหัวตาราง" แบบ dynamic (ไม่จำเป็นต้องอยู่แถวแรก)
   - map คอลัมน์ตาม "ชื่อหัว" ไม่อิงตำแหน่งตายตัว
   - ตรวจแถวหัวซ้ำกลางชีตได้
   ============================================================ */
import type { SourceField, SourceColumnMap, DetectedHeader } from "./sync.types";

/** alias ของหัวคอลัมน์ต้นทางแต่ละฟิลด์ (รองรับหลายชื่อ) */
export const SOURCE_ALIASES: Record<SourceField, string[]> = {
  date: ["วันที่", "date"],
  caseNo: ["รหัสเคส", "เลขเคส", "case no", "caseno"],
  company: ["ชื่อบริษัท", "บริษัท", "company"],
  prelim: ["คุยรายละเอียดเบื้องต้น", "รายละเอียดเบื้องต้น", "รายละเอียด"],
  quote: ["ทำใบเสนอราคา", "ใบเสนอราคา"],
  quoteLink: ["ลิงก์ใบเสนอราคา", "ลิ้งใบเสนอราคา", "link ใบเสนอราคา"],
  follow1: ["ติดตามผลครั้งที่ 1", "ติดตามรอบ 1", "ติดตาม 1"],
  follow2: ["ติดตามผลครั้งที่ 2", "ติดตามรอบ 2", "ติดตาม 2"],
  follow3: ["ติดตามผลครั้งที่ 3", "ติดตามรอบ 3", "ติดตาม 3"],
  customerStatus: ["สถานะลูกค้า", "สถานะ"],
  deposit: ["มัดจำ"],
  draftContract: ["ร่างสัญญา"],
  contractLink: ["ลิงก์สัญญา", "ลิ้งสัญญา", "link สัญญา"],
};

const FIELDS = Object.keys(SOURCE_ALIASES) as SourceField[];

export function normalizeCell(v: string): string {
  return (v ?? "").toString().trim().toLowerCase().replace(/\s+/g, "");
}

const NORMALIZED_ALIASES: Record<SourceField, string[]> = FIELDS.reduce((acc, f) => {
  acc[f] = SOURCE_ALIASES[f].map(normalizeCell);
  return acc;
}, {} as Record<SourceField, string[]>);

/** สร้าง column map จากแถวหัว (คืน map + จำนวนฟิลด์ที่จับได้) */
function buildColumnMap(row: string[]): { columnMap: SourceColumnMap; matched: number } {
  const columnMap: SourceColumnMap = {};
  let matched = 0;
  row.forEach((cell, idx) => {
    const norm = normalizeCell(cell);
    if (!norm) return;
    for (const field of FIELDS) {
      if (columnMap[field] === undefined && NORMALIZED_ALIASES[field].includes(norm)) {
        columnMap[field] = idx;
        matched++;
        break;
      }
    }
  });
  return { columnMap, matched };
}

/** จำนวนฟิลด์ที่แถวนี้ match กับ header (ใช้ตรวจแถวหัวซ้ำ) */
export function countHeaderMatches(row: string[]): number {
  return buildColumnMap(row).matched;
}

/**
 * หาแถวหัวตาราง: เลือกแถวที่ match ฟิลด์ต้นทางมากที่สุด (>= minMatches)
 * ค้นเฉพาะ N แถวแรกเพื่อประสิทธิภาพ
 */
export function detectHeaderRow(values: string[][], minMatches = 3, scanRows = 30): DetectedHeader | null {
  let best: DetectedHeader | null = null;
  const limit = Math.min(values.length, scanRows);
  for (let i = 0; i < limit; i++) {
    const { columnMap, matched } = buildColumnMap(values[i] ?? []);
    if (matched >= minMatches && (!best || matched > best.matchedCount)) {
      best = { headerRowIndex: i, columnMap, matchedCount: matched };
    }
  }
  return best;
}
