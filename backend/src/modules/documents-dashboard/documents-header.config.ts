/* ============================================================
   Documents Header Mapping (pure) — อ้างอิงชื่อ header จริง ไม่ผูก index
   - ตรวจ header row แบบ dynamic (อาจไม่อยู่แถวแรก)
   - resolve คอลัมน์สถานะแบบ priority + fallback (เพราะแท็บ DOCUMENTS จริง
     คอลัมน์ "สถานะลูกค้า" ว่าง แต่ค่าขั้นตอนจริงอยู่ในคอลัมน์อื่น)
   ============================================================ */

export type DocField =
  | "workDate" | "caseNo" | "assignee" | "company" | "detail"
  | "quotation" | "quotationLink"
  | "followUp1" | "followUp2" | "followUp3"
  | "status" | "deposit" | "contractDraft" | "contractLink"
  | "sourceSheet" | "sourceRow";

export const DOC_ALIASES: Record<DocField, string[]> = {
  workDate: ["วันที่", "วันที่รับงาน", "date"],
  caseNo: ["รหัสเคส", "case no", "case number", "caseno"],
  assignee: ["ผู้รับผิดชอบ", "ผู้ดูแลงาน", "ผู้ดำเนินการ", "assignee"],
  company: ["ชื่อบริษัท", "บริษัท", "customer", "customer name"],
  detail: ["รายละเอียดเบื้องต้น", "คุยรายละเอียดเบื้องต้น", "รายละเอียดงาน", "รายละเอียด"],
  quotation: ["ทำใบเสนอราคา", "สถานะใบเสนอราคา"],
  quotationLink: ["ลิงก์ใบเสนอราคา", "ส่งใบเสนอราคา", "ลิ้งใบเสนอราคา"],
  followUp1: ["ติดตามรอบ 1", "ติดตามผลครั้งที่ 1", "ติดตาม 1"],
  followUp2: ["ติดตามรอบ 2", "ติดตามผลครั้งที่ 2", "ติดตาม 2"],
  followUp3: ["ติดตามรอบ 3", "ติดตามผลครั้งที่ 3", "ติดตาม 3"],
  // สถานะเฉพาะ (priority สูง) — resolveStatus จะ fallback ไป quotation/followUp ถ้าว่าง
  status: ["สถานะงาน", "ขั้นตอนปัจจุบัน", "ผลการดำเนินการ", "สถานะ", "สถานะลูกค้า"],
  deposit: ["มัดจำ", "มัดจำ (ส่งขาด)", "มัดจำ(ส่งขาด)"],
  contractDraft: ["ร่างสัญญา"],
  contractLink: ["ลิงก์สัญญา", "ส่งลิงก์สัญญา", "ลิ้งสัญญา"],
  sourceSheet: ["source_sheet"],
  sourceRow: ["source_row"],
};

const FIELDS = Object.keys(DOC_ALIASES) as DocField[];
const DETECT_FIELDS: DocField[] = ["workDate", "caseNo", "assignee", "company", "detail", "status"];

export type DocColumnMap = Partial<Record<DocField, number>>;

export function normalizeHeader(v: string): string {
  return (v ?? "").toString().trim().toLowerCase().replace(/\s+/g, "");
}

const NORMALIZED: Record<DocField, string[]> = FIELDS.reduce((acc, f) => {
  acc[f] = DOC_ALIASES[f].map(normalizeHeader);
  return acc;
}, {} as Record<DocField, string[]>);

function buildColumnMap(row: string[]): { map: DocColumnMap; matched: number } {
  const map: DocColumnMap = {};
  let matched = 0;
  row.forEach((cell, idx) => {
    const norm = normalizeHeader(cell);
    if (!norm) return;
    for (const field of FIELDS) {
      if (map[field] === undefined && NORMALIZED[field].includes(norm)) {
        map[field] = idx;
        matched++;
        break;
      }
    }
  });
  return { map, matched };
}

export function countHeaderMatches(row: string[]): number {
  return DETECT_FIELDS.filter((f) => {
    const norm = row.map(normalizeHeader);
    return NORMALIZED[f].some((a) => norm.includes(a));
  }).length;
}

export interface DetectedDocHeader {
  headerRowIndex: number;
  columnMap: DocColumnMap;
  matchedCount: number;
  headers: string[];
}

/** หา header row (แถวที่ match ฟิลด์มากสุด ใน N แถวแรก) */
export function detectHeaderRow(values: string[][], minMatches = 3, scanRows = 30): DetectedDocHeader | null {
  let best: DetectedDocHeader | null = null;
  const limit = Math.min(values.length, scanRows);
  for (let i = 0; i < limit; i++) {
    const row = values[i] ?? [];
    const { map, matched } = buildColumnMap(row);
    if (matched >= minMatches && (!best || matched > best.matchedCount)) {
      best = { headerRowIndex: i, columnMap: map, matchedCount: matched, headers: row.map((h) => (h ?? "").toString().trim()) };
    }
  }
  return best;
}

/** สร้าง mapping (canonical → ชื่อ header จริง) + รายการ header ที่ยัง map ไม่ได้ */
export function buildMappingReport(headers: string[], columnMap: DocColumnMap): { mapping: Record<string, string | null>; unmapped: string[] } {
  const mapping: Record<string, string | null> = {};
  for (const f of FIELDS) {
    const idx = columnMap[f];
    mapping[f] = idx === undefined ? null : headers[idx] ?? null;
  }
  const mappedIdx = new Set(Object.values(columnMap));
  const unmapped = headers.filter((h, i) => h.trim() !== "" && !mappedIdx.has(i));
  return { mapping, unmapped };
}
