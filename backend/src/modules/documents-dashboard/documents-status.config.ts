/* ============================================================
   Documents Status Classification (configurable, pure)
   จัดกลุ่มค่าสถานะ/ขั้นตอนของงานเอกสาร → in_progress / completed / issues / unclassified
   - normalize: trim, ลด whitespace, lowercase อังกฤษ, ตัด phinthu ที่พิมพ์เกิน
   - เทียบ exact ต่อค่า (ไม่ใช้ contains กว้าง)
   ============================================================ */
import type { CustomerStatusGroup } from "@tracking-cyd/shared";

export const DOCUMENTS_STATUS_GROUPS: Record<Exclude<CustomerStatusGroup, "unclassified">, string[]> = {
  in_progress: [
    "กำลังดำเนินการ",
    "ดำเนินการเรียบร้อย แต่ยังไม่ปิด",
    "รอเอกสาร",
    "รอลูกค้า",
    "รอตรวจสอบ",
    "อยู่ระหว่างจัดทำ",
    "อยู่ระหว่างติดตาม",
    "in progress",
    "pending",
  ],
  completed: [
    "ดำเนินการเรียบร้อย",
    "ดำเนินการเสร็จแล้ว",
    "เสร็จสิ้น",
    "ปิดงานแล้ว",
    "สำเร็จ",
    "completed",
    "closed",
    "done",
  ],
  issues: [
    "เอกสารไม่ครบ",
    "ติดต่อลูกค้าไม่ได้",
    "งานล่าช้า",
    "เกินกำหนด",
    "ติดปัญหา",
    "ยกเลิก",
    "failed",
    "rejected",
  ],
} as const;

export const GROUP_LABELS: Record<CustomerStatusGroup, string> = {
  in_progress: "กำลังดำเนินการ",
  completed: "เสร็จสิ้น",
  issues: "มีปัญหา/ต้องติดตาม",
  unclassified: "ยังไม่ระบุสถานะ",
};

export const GROUP_ORDER: CustomerStatusGroup[] = ["in_progress", "completed", "issues", "unclassified"];

export function normalizeStatus(raw: string): string {
  return (raw ?? "")
    .toString()
    .replace(/ฺ/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

const LOOKUP: Map<string, CustomerStatusGroup> = (() => {
  const map = new Map<string, CustomerStatusGroup>();
  (Object.entries(DOCUMENTS_STATUS_GROUPS) as [Exclude<CustomerStatusGroup, "unclassified">, string[]][]).forEach(
    ([group, values]) => {
      for (const v of values) map.set(normalizeStatus(v), group);
    },
  );
  return map;
})();

export function classifyStatus(raw: string): CustomerStatusGroup {
  const norm = normalizeStatus(raw);
  if (!norm) return "unclassified";
  return LOOKUP.get(norm) ?? "unclassified";
}

export function isUnknownStatus(raw: string): boolean {
  const norm = normalizeStatus(raw);
  return norm.length > 0 && !LOOKUP.has(norm);
}

/** normalize ชื่อผู้รับผิดชอบ (รวม typo เช่น "พี่อััง" → "พี่อัง") */
export function normalizeAssignee(raw: string): string {
  return (raw ?? "").toString().replace(/ฺ/g, "").trim().replace(/\s+/g, " ")
    // ยุบสระ/วรรณยุกต์ซ้ำติดกัน (พี่อััง → พี่อัง)
    .replace(/([ั-ฺ็-๎])\1+/g, "$1");
}

/* ============================================================
   Payment status classification (สถานะการชำระ)
   - ค่าจริงมักมีข้อความ/ตัวเลขต่อท้าย (เช่น "ชำระแล้ว 7", "รอชำระค่าตีวีซ่า 23/07/26")
   - จำแนกด้วย keyword ที่ต้นข้อความ (ไม่กว้างเกินไป)
   ============================================================ */
export type PaymentGroup = "paid" | "pending" | "partial" | "problem" | "unclassified";

export const PAYMENT_LABELS: Record<PaymentGroup, string> = {
  paid: "ชำระแล้ว",
  pending: "รอชำระ",
  partial: "ชำระบางส่วน",
  problem: "มีปัญหา",
  unclassified: "ยังไม่ระบุ",
};

// ตรวจ partial/problem ก่อน paid/pending (คำเฉพาะเจาะจงมาก่อน)
const PARTIAL_KEYWORDS = ["ชำระบางส่วน", "จ่ายบางส่วน", "มัดจำ", "partial"];
const PROBLEM_KEYWORDS = ["ยกเลิก", "ปฏิเสธ", "มีปัญหา", "ค้างชำระ", "เกินกำหนด", "problem", "failed"];
const PAID_KEYWORDS = ["ชำระแล้ว", "ชำระเรียบร้อย", "เรียบร้อยแล้ว", "จ่ายแล้ว", "paid"];
const PENDING_KEYWORDS = ["รอชำระ", "ยังไม่ชำระ", "ยังไม่ได้ชำระ", "pending", "รอโอน"];

function hasKeyword(norm: string, keywords: string[]): boolean {
  return keywords.some((k) => { const n = normalizeStatus(k); return norm.startsWith(n) || norm.includes(n); });
}

export function classifyPayment(raw: string): PaymentGroup {
  const norm = normalizeStatus(raw);
  if (!norm) return "unclassified";
  if (hasKeyword(norm, PARTIAL_KEYWORDS)) return "partial";
  if (hasKeyword(norm, PROBLEM_KEYWORDS)) return "problem";
  if (hasKeyword(norm, PAID_KEYWORDS)) return "paid";
  if (hasKeyword(norm, PENDING_KEYWORDS)) return "pending";
  return "unclassified";
}
