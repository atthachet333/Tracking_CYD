/* ============================================================
   Customer Status Classification (configurable, pure)
   - จัดกลุ่มค่า "สถานะลูกค้า" → in_progress / completed / issues / unclassified
   - Normalize ก่อนเทียบ: trim, ลด whitespace ซ้ำ, lowercase (อังกฤษ),
     ตัด phinthu (U+0E3A) ที่มักพิมพ์เกินในคำไทย เช่น "ลูกค้าปฏฺิเสธ"
   - เทียบแบบ exact ต่อค่า (ไม่ใช้ contains กว้าง ๆ ที่จำแนกผิด)
   ============================================================ */
import type { CustomerStatusGroup } from "@tracking-cyd/shared";

/** กลุ่มสถานะ (แก้ไข/เพิ่มค่าที่นี่ที่เดียว) */
export const CUSTOMER_STATUS_GROUPS: Record<Exclude<CustomerStatusGroup, "unclassified">, string[]> = {
  in_progress: [
    "กำลังพิจารณา",
    "รอพิจารณา",
    "รอติดตาม",
    "รอเอกสาร",
    "รอลงนาม",
    "กำลังดำเนินการ",
    "ติดต่อแล้ว",
    "อยู่ระหว่างเจรจา",
    "in progress",
    "pending",
  ],
  completed: [
    "ลงนามแล้ว",
    "ปิดเคสสำเร็จ",
    "สำเร็จ",
    "ทำสัญญาแล้ว",
    "ลูกค้าตกลง",
    "completed",
    "closed won",
    "done",
  ],
  issues: [
    "ลูกค้าปฏิเสธ",
    "ลูกค้ายกเลิก",
    "ติดต่อไม่ได้",
    "ไม่มีการตอบกลับ",
    "เอกสารไม่ครบ",
    "เกินกำหนด",
    "มีปัญหา",
    "failed",
    "rejected",
    "closed lost",
  ],
} as const;

/** ป้ายภาษาไทยของแต่ละกลุ่ม (ใช้ใน distribution / UI) */
export const GROUP_LABELS: Record<CustomerStatusGroup, string> = {
  in_progress: "กำลังดำเนินการ",
  completed: "ปิดเคสสำเร็จ",
  issues: "เคสที่มีปัญหา",
  unclassified: "ยังไม่ระบุสถานะ",
};

/** ลำดับแสดงผลของกลุ่ม */
export const GROUP_ORDER: CustomerStatusGroup[] = ["in_progress", "completed", "issues", "unclassified"];

/** normalize ค่าก่อนเทียบ */
export function normalizeStatus(raw: string): string {
  return (raw ?? "")
    .toString()
    .replace(/ฺ/g, "") // ตัด phinthu ที่พิมพ์เกิน (typo)
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/** ตาราง lookup: normalized value → group (สร้างครั้งเดียว) */
const LOOKUP: Map<string, CustomerStatusGroup> = (() => {
  const map = new Map<string, CustomerStatusGroup>();
  (Object.entries(CUSTOMER_STATUS_GROUPS) as [Exclude<CustomerStatusGroup, "unclassified">, string[]][]).forEach(
    ([group, values]) => {
      for (const v of values) map.set(normalizeStatus(v), group);
    },
  );
  return map;
})();

/**
 * จำแนกค่าสถานะดิบ → กลุ่ม
 * - ค่าว่าง → unclassified
 * - ค่าที่ไม่รู้จัก → unclassified (ผู้เรียกควรเก็บไว้เป็น warning)
 */
export function classifyStatus(raw: string): CustomerStatusGroup {
  const norm = normalizeStatus(raw);
  if (!norm) return "unclassified";
  return LOOKUP.get(norm) ?? "unclassified";
}

/** true ถ้าเป็นค่าที่ "มีข้อความแต่ไม่รู้จัก" (เพื่อออก warning ให้ตรวจ Sheet) */
export function isUnknownStatus(raw: string): boolean {
  const norm = normalizeStatus(raw);
  return norm.length > 0 && !LOOKUP.has(norm);
}
