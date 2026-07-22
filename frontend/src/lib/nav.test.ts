import { describe, it, expect } from "vitest";
import { NAV } from "./nav";

const labels = NAV.flatMap((g) => g.items.map((i) => i.label));
const routes = NAV.flatMap((g) => g.items.map((i) => i.to));

describe("Sidebar navigation", () => {
  it("ไม่มี 3 เมนูที่ถูกเอาออก", () => {
    expect(labels).not.toContain("ศูนย์จัดการงานเอกสาร");
    expect(labels).not.toContain("ศูนย์อนุมัติเอกสาร");
    expect(labels).not.toContain("ปฏิทินงาน");
    expect(routes).not.toContain("/dashboard/documents");
    expect(routes).not.toContain("/dashboard/approvals");
    expect(routes).not.toContain("/dashboard/calendar");
  });

  it("มีเมนูตามสเปก 10 รายการ", () => {
    expect(labels).toEqual([
      "Executive Overview",
      "ภาพรวมแอดมิน",
      "ภาพรวมแผนกเอกสาร",
      "ภาพรวมแอดมินและเอกสาร",
      "งานทั้งหมด",
      "ลูกค้า",
      "รายงานและวิเคราะห์",
      "การแจ้งเตือน",
      "เชื่อมต่อ Google Sheets",
      "ตั้งค่าระบบ",
    ]);
    expect(routes).toContain("/dashboard/admin-overview");
    expect(routes).toContain("/dashboard/documents-overview");
    expect(routes).toContain("/dashboard/team");
    expect(routes).toContain("/dashboard/settings/integrations/google-sheets");
  });

  it("เปลี่ยนชื่อทีมเป็น 'ภาพรวมแอดมินและเอกสาร'", () => {
    expect(labels).toContain("ภาพรวมแอดมินและเอกสาร");
    expect(labels).not.toContain("ภาพรวมทีมงานและแผนก");
    expect(labels).not.toContain("ภาพรวมทีมงานและเอกสาร");
  });

  it("ไม่มี route ซ้ำ", () => {
    expect(new Set(routes).size).toBe(routes.length);
  });
});
