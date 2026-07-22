import { describe, it, expect } from "vitest";
import { classifyStatus, isUnknownStatus, normalizeStatus } from "./customer-status.config";

describe("normalizeStatus", () => {
  it("trim + ลด whitespace + lowercase อังกฤษ", () => {
    expect(normalizeStatus("  Closed WON  ")).toBe("closed won");
    expect(normalizeStatus("รอ   ลงนาม")).toBe("รอ ลงนาม");
  });
  it("ตัด phinthu (typo) ให้เทียบได้", () => {
    // "ลูกค้าปฏฺิเสธ" (มี ฺ เกิน) → เท่ากับ "ลูกค้าปฏิเสธ"
    expect(normalizeStatus("ลูกค้าปฏฺิเสธ")).toBe(normalizeStatus("ลูกค้าปฏิเสธ"));
  });
});

describe("classifyStatus (ค่าจริงจากชีต)", () => {
  it("ลูกค้าปฏิเสธ → issues (รวม typo)", () => {
    expect(classifyStatus("ลูกค้าปฏิเสธ")).toBe("issues");
    expect(classifyStatus("ลูกค้าปฏฺิเสธ")).toBe("issues");
    expect(classifyStatus("ไม่มีการตอบกลับ")).toBe("issues");
  });
  it("ลงนามแล้ว → completed", () => {
    expect(classifyStatus("ลงนามแล้ว")).toBe("completed");
  });
  it("กำลังพิจารณา / รอพิจารณา / รอลงนาม → in_progress", () => {
    expect(classifyStatus("กำลังพิจารณา")).toBe("in_progress");
    expect(classifyStatus("รอพิจารณา")).toBe("in_progress");
    expect(classifyStatus("รอลงนาม")).toBe("in_progress");
  });
  it("ค่าว่าง → unclassified", () => {
    expect(classifyStatus("")).toBe("unclassified");
    expect(classifyStatus("   ")).toBe("unclassified");
  });
  it("ค่าไม่รู้จัก → unclassified + ตรวจได้ว่า unknown", () => {
    expect(classifyStatus("สถานะแปลกใหม่")).toBe("unclassified");
    expect(isUnknownStatus("สถานะแปลกใหม่")).toBe(true);
    expect(isUnknownStatus("")).toBe(false);
    expect(isUnknownStatus("ลงนามแล้ว")).toBe(false);
  });
  it("รองรับค่าอังกฤษ", () => {
    expect(classifyStatus("Closed Won")).toBe("completed");
    expect(classifyStatus("REJECTED")).toBe("issues");
  });
});
