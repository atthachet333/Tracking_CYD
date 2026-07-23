import { describe, it, expect } from "vitest";
import { BRAND } from "./brand";
import { CURRENT_USER } from "./current-user";
import { COLUMN_LABELS, labelOf } from "./column-labels";

describe("BRAND config", () => {
  it("ใช้ logo.png เป็นโลโก้/favicon กลาง", () => {
    expect(BRAND.logoPath).toBe("/logo.png");
    expect(BRAND.faviconPath).toBe("/logo.png");
    expect(BRAND.logoAlt).toBe("CHAIYADET PROGRESS");
  });
});

describe("CURRENT_USER config", () => {
  it("เป็น Executive / ผู้บริหาร และมี avatar เดิม (ไม่ใช้โลโก้แทน avatar)", () => {
    expect(CURRENT_USER.displayName).toBe("Executive");
    expect(CURRENT_USER.roleLabel).toBe("ผู้บริหาร");
    expect(CURRENT_USER.avatarUrl).not.toBe("/logo.png");
    expect(CURRENT_USER.avatarUrl).toMatch(/^https?:\/\//);
  });
  it("ไม่มีคำว่า Administrator / ผู้ดูแลระบบ", () => {
    expect(CURRENT_USER.displayName).not.toBe("Administrator");
    expect(CURRENT_USER.roleLabel).not.toBe("ผู้ดูแลระบบ");
  });
});

describe("COLUMN_LABELS (ไทย)", () => {
  it("มี label ไทยของ 7 คอลัมน์เอกสาร", () => {
    expect(COLUMN_LABELS.caseStatus).toBe("สถานะเคส");
    expect(COLUMN_LABELS.paymentStatus).toBe("สถานะการชำระ");
    expect(COLUMN_LABELS.initialDetail).toBe("รายละเอียดเบื้องต้น");
    expect(labelOf("workDate")).toBe("วันที่");
    expect(labelOf("unknownKey")).toBe("unknownKey"); // fallback
  });
});
