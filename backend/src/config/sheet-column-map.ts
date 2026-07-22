/* ============================================================
   Header Mapping configuration
   - map ตาม "ชื่อ header" (ไทย/อังกฤษ) ไม่ผูกกับ index คงที่
   - แก้ไข/เพิ่ม alias ได้ที่นี่ (หรือผ่านหน้า Settings ในอนาคต)
   ============================================================ */

/** ฟิลด์มาตรฐานของระบบ */
export type CanonicalField =
  | "caseNo"
  | "customerName"
  | "status"
  | "assignee"
  | "department"
  | "serviceType"
  | "dueDate"
  | "createdDate"
  | "closedDate"
  | "progress"
  | "sla"
  | "documentType"
  | "amount";

/** ฟิลด์ที่ "จำเป็น" — ถ้า sheet ไม่มีจะเพิ่ม warning */
export const REQUIRED_FIELDS: CanonicalField[] = ["caseNo", "customerName", "status"];

/** alias ของแต่ละฟิลด์ (เทียบแบบ normalize: ตัดช่องว่าง/ตัวพิมพ์) */
export const COLUMN_ALIASES: Record<CanonicalField, string[]> = {
  caseNo: ["Case No", "Case Number", "CaseNo", "เลขเคส", "รหัสเคส", "เลขที่เคส", "รหัสงาน"],
  customerName: ["Customer", "Customer Name", "ลูกค้า", "ชื่อลูกค้า", "บริษัท", "ชื่อบริษัท"],
  status: ["Status", "สถานะ", "สถานะงาน"],
  assignee: ["Assignee", "Owner", "ผู้รับผิดชอบ", "ผู้ดำเนินการ", "ผู้รับงาน"],
  department: ["Department", "แผนก", "ฝ่าย"],
  serviceType: ["Service Type", "ServiceType", "ประเภทบริการ", "บริการ"],
  dueDate: ["Due Date", "Deadline", "DueDate", "วันครบกำหนด", "กำหนดส่ง", "วันกำหนดส่ง"],
  createdDate: ["Created Date", "Open Date", "CreatedDate", "วันที่เปิด", "วันที่รับงาน", "วันที่สร้าง"],
  closedDate: ["Closed Date", "ClosedDate", "วันที่ปิด", "วันปิดงาน"],
  progress: ["Progress", "ความคืบหน้า", "เปอร์เซ็นต์", "%"],
  sla: ["SLA", "SLA Status", "สถานะ SLA", "SLA %"],
  documentType: ["Document Type", "DocumentType", "ประเภทเอกสาร", "เอกสาร"],
  amount: ["Amount", "Revenue", "มูลค่า", "รายได้", "จำนวนเงิน", "ยอด"],
};

/** normalize ชื่อ header เพื่อเทียบ (ตัดช่องว่าง, ตัวพิมพ์เล็ก) */
export function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, "");
}

/**
 * สร้าง mapping จาก header จริง → canonical field
 * คืน record: canonicalField -> header จริง (หรือ null ถ้าไม่พบ)
 */
export function buildColumnMapping(headers: string[]): Record<CanonicalField, string | null> {
  const normalizedHeaders = headers.map((h) => ({ raw: h, norm: normalizeHeader(h) }));
  const result = {} as Record<CanonicalField, string | null>;

  (Object.keys(COLUMN_ALIASES) as CanonicalField[]).forEach((field) => {
    const aliases = COLUMN_ALIASES[field].map(normalizeHeader);
    const found = normalizedHeaders.find((h) => aliases.includes(h.norm));
    result[field] = found ? found.raw : null;
  });

  return result;
}
