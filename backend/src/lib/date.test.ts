import { describe, it, expect } from "vitest";
import { parseSheetDate, daysBetween } from "./date";

describe("parseSheetDate", () => {
  it("DD/MM/BBBB (พ.ศ.) → ค.ศ. ISO", () => {
    expect(parseSheetDate("15/07/2569")).toBe("2026-07-15");
  });
  it("DD/MM/YYYY (ค.ศ.)", () => {
    expect(parseSheetDate("15/07/2026")).toBe("2026-07-15");
  });
  it("ISO YYYY-MM-DD", () => {
    expect(parseSheetDate("2026-07-15")).toBe("2026-07-15");
  });
  it("สตริงวันที่ภาษาไทย", () => {
    expect(parseSheetDate("1 ก.ค. 2569")).toBe("2026-07-01");
    expect(parseSheetDate("1 กรกฎาคม 2569")).toBe("2026-07-01");
  });
  it("serial number ของ Google Sheets", () => {
    expect(parseSheetDate(1)).toBe("1899-12-31");
  });
  it("ค่าว่าง/ขีด → null", () => {
    expect(parseSheetDate("")).toBeNull();
    expect(parseSheetDate("   ")).toBeNull();
    expect(parseSheetDate("-")).toBeNull();
    expect(parseSheetDate(null)).toBeNull();
    expect(parseSheetDate(undefined)).toBeNull();
  });
  it("วันที่ไม่ถูกต้อง → null (ไม่ throw)", () => {
    expect(parseSheetDate("31/02/2026")).toBeNull();
    expect(parseSheetDate("ไม่ใช่วันที่")).toBeNull();
  });
});

describe("daysBetween", () => {
  it("คำนวณส่วนต่างวัน", () => {
    expect(daysBetween("2026-07-01", "2026-07-11")).toBe(10);
    expect(daysBetween("2026-07-11", "2026-07-01")).toBe(-10);
  });
});
