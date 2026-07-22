import { describe, it, expect } from "vitest";
import { classifyStatus, isUnknownStatus, normalizeStatus, normalizeAssignee, classifyPayment } from "./documents-status.config";

describe("classifyPayment (สถานะการชำระ — ค่ามีข้อความต่อท้าย)", () => {
  it("ชำระแล้ว/เรียบร้อย → paid", () => {
    expect(classifyPayment("ชำระแล้ว 7")).toBe("paid");
    expect(classifyPayment("เรียบร้อยแล้ว")).toBe("paid");
  });
  it("รอชำระ... → pending", () => {
    expect(classifyPayment("รอชำระค่าตีวีซ่า 23/07/26")).toBe("pending");
  });
  it("ว่าง/ไม่รู้จัก → unpaid", () => {
    expect(classifyPayment("")).toBe("unpaid");
    expect(classifyPayment("อื่น ๆ")).toBe("unpaid");
  });
});

describe("documents classifyStatus", () => {
  it("ดำเนินการเรียบร้อย → completed", () => {
    expect(classifyStatus("ดำเนินการเรียบร้อย")).toBe("completed");
    expect(classifyStatus("เสร็จสิ้น")).toBe("completed");
    expect(classifyStatus("Completed")).toBe("completed");
  });
  it("กำลังดำเนินการ / รอเอกสาร → in_progress", () => {
    expect(classifyStatus("กำลังดำเนินการ")).toBe("in_progress");
    expect(classifyStatus("รอเอกสาร")).toBe("in_progress");
    expect(classifyStatus("ดำเนินการเรียบร้อย แต่ยังไม่ปิด")).toBe("in_progress");
  });
  it("เอกสารไม่ครบ / เกินกำหนด → issues", () => {
    expect(classifyStatus("เอกสารไม่ครบ")).toBe("issues");
    expect(classifyStatus("เกินกำหนด")).toBe("issues");
    expect(classifyStatus("ยกเลิก")).toBe("issues");
  });
  it("ว่าง → unclassified, ไม่รู้จัก → unclassified + unknown", () => {
    expect(classifyStatus("")).toBe("unclassified");
    expect(classifyStatus("อะไรสักอย่าง")).toBe("unclassified");
    expect(isUnknownStatus("อะไรสักอย่าง")).toBe(true);
    expect(isUnknownStatus("")).toBe(false);
  });
  it("normalizeStatus ตัด whitespace/phinthu + lowercase", () => {
    expect(normalizeStatus("  Closed  ")).toBe("closed");
  });
});

describe("normalizeAssignee", () => {
  it("ยุบสระ/วรรณยุกต์ซ้ำ (typo)", () => {
    // "พี่อััง" (ั ซ้ำ) → "พี่อัง"
    expect(normalizeAssignee("พี่อััง")).toBe(normalizeAssignee("พี่อัง"));
    expect(normalizeAssignee("  พี่แอน  ")).toBe("พี่แอน");
  });
});
