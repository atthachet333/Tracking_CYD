/* ============================================================
   ป้ายชื่อคอลัมน์ภาษาไทย (ใช้ร่วมกันทุกตาราง / Export / Tooltip / Drawer)
   - ชื่อ field ภาษาอังกฤษใช้ภายใน TS/API เท่านั้น
   - UI ต้องแสดงภาษาไทยจากที่นี่เสมอ (ไม่กระจาย label ซ้ำ)
   ============================================================ */
export const COLUMN_LABELS = {
  workDate: "วันที่",
  department: "แผนก",
  departmentLabel: "แผนก",
  caseNo: "รหัสเคส",
  companyName: "ชื่อบริษัท",
  company: "ชื่อบริษัท",
  assignee: "ผู้รับผิดชอบ",
  initialDetail: "รายละเอียดเบื้องต้น",
  detail: "รายละเอียดเบื้องต้น",
  quotationStatus: "สถานะใบเสนอราคา",
  quotationLink: "ลิงก์ใบเสนอราคา",
  paymentStatus: "สถานะการชำระ",
  followUp1: "ติดตามรอบ 1",
  followUp2: "ติดตามรอบ 2",
  followUp3: "ติดตามรอบ 3",
  customerStatus: "สถานะลูกค้า",
  depositStatus: "สถานะมัดจำ",
  contractDraftStatus: "สถานะร่างสัญญา",
  contractLink: "ลิงก์สัญญา",
  actualStatus: "สถานะงาน",
  statusGroup: "กลุ่มสถานะ",
  latestFollowUp: "ติดตามล่าสุด",
  links: "ลิงก์ที่เกี่ยวข้อง",
  sourceSheet: "แหล่งข้อมูล",
  sourceRow: "แถวต้นทาง",
} as const;

export type ColumnKey = keyof typeof COLUMN_LABELS;

/** คืน label ภาษาไทยของ field (fallback = ชื่อ field เดิม) */
export function labelOf(key: string): string {
  return (COLUMN_LABELS as Record<string, string>)[key] ?? key;
}
