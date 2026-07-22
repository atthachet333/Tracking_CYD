/* ============================================================
   Date parsing สำหรับข้อมูลจาก Google Sheets
   รองรับหลายรูปแบบ + แปลง พ.ศ. → ค.ศ. (timezone Asia/Bangkok, date-only)
   ค่าที่ไม่ถูกต้อง → null (ไม่ throw)
   ============================================================ */

const THAI_MONTHS: Record<string, number> = {
  "ม.ค.": 1, มกราคม: 1,
  "ก.พ.": 2, กุมภาพันธ์: 2,
  "มี.ค.": 3, มีนาคม: 3,
  "เม.ย.": 4, เมษายน: 4,
  "พ.ค.": 5, พฤษภาคม: 5,
  "มิ.ย.": 6, มิถุนายน: 6,
  "ก.ค.": 7, กรกฎาคม: 7,
  "ส.ค.": 8, สิงหาคม: 8,
  "ก.ย.": 9, กันยายน: 9,
  "ต.ค.": 10, ตุลาคม: 10,
  "พ.ย.": 11, พฤศจิกายน: 11,
  "ธ.ค.": 12, ธันวาคม: 12,
};

function beToCe(year: number): number {
  // ปีที่ >= 2400 ถือเป็น พ.ศ. → แปลงเป็น ค.ศ.
  return year >= 2400 ? year - 543 : year;
}

function toISO(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) {
    return null; // เช่น 31/02
  }
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

/**
 * แปลงค่าวันที่จาก Google Sheets เป็น ISO date (YYYY-MM-DD) หรือ null
 * รองรับ: DD/MM/YYYY, DD/MM/BBBB, YYYY-MM-DD, serial number, สตริงไทย, ค่าว่าง
 */
export function parseSheetDate(input: unknown): string | null {
  if (input === null || input === undefined) return null;

  // ตัวเลข = serial date ของ Google Sheets (วันที่นับจาก 1899-12-30)
  if (typeof input === "number" && Number.isFinite(input)) {
    return serialToISO(input);
  }

  const raw = String(input).trim();
  if (raw === "" || raw === "-") return null;

  // ISO: YYYY-MM-DD
  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    return toISO(beToCe(Number(iso[1])), Number(iso[2]), Number(iso[3]));
  }

  // DD/MM/YYYY หรือ DD/MM/BBBB (คั่นด้วย / . หรือ -)
  const dmy = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    let year = Number(dmy[3]);
    if (year < 100) year += year > 50 ? 1900 : 2000; // 2 หลัก
    return toISO(beToCe(year), month, day);
  }

  // สตริงไทย: "1 ก.ค. 2569" หรือ "1 กรกฎาคม 2569"
  const thai = raw.match(/^(\d{1,2})\s+([^\s\d]+\.?[^\s\d]*\.?)\s+(\d{4})/);
  if (thai) {
    const day = Number(thai[1]);
    const month = THAI_MONTHS[thai[2]];
    const year = beToCe(Number(thai[3]));
    if (month) return toISO(year, month, day);
  }

  // serial ในรูปสตริงตัวเลขล้วน
  if (/^\d+(\.\d+)?$/.test(raw)) {
    return serialToISO(Number(raw));
  }

  // fallback: ให้ Date พยายาม parse (เช่น "Jul 1 2026")
  const t = Date.parse(raw);
  if (!Number.isNaN(t)) {
    const d = new Date(t);
    return toISO(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  }

  return null;
}

function serialToISO(serial: number): string | null {
  if (serial <= 0 || serial > 100000) return null;
  const epoch = Date.UTC(1899, 11, 30);
  const d = new Date(epoch + Math.round(serial) * 86400000);
  return toISO(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

/** วันนี้ (Asia/Bangkok) เป็น ISO date */
export function todayBangkokISO(now: Date = new Date()): string {
  const bkk = new Date(now.getTime() + 7 * 3600 * 1000);
  return toISO(bkk.getUTCFullYear(), bkk.getUTCMonth() + 1, bkk.getUTCDate()) ?? "";
}

/** จำนวนวันระหว่างสอง ISO date (b - a) */
export function daysBetween(aISO: string, bISO: string): number {
  const a = Date.parse(aISO + "T00:00:00Z");
  const b = Date.parse(bISO + "T00:00:00Z");
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.round((b - a) / 86400000);
}
