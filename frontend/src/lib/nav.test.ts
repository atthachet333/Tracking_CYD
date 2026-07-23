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

  it("มีเมนูครบ (รวมเมนู admin ที่ป้องกันด้วย permission)", () => {
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
      "Audit Log",
      "ตั้งค่าระบบ",
    ]);
    expect(routes).toContain("/dashboard/admin-overview");
    expect(routes).toContain("/dashboard/documents-overview");
    expect(routes).toContain("/dashboard/team");
    expect(routes).toContain("/dashboard/audit-log");
  });

  it("เมนู admin-only ต้องมี permission (executive จะถูกกรองออก)", () => {
    const byLabel = (l: string) => NAV.flatMap((g) => g.items).find((i) => i.label === l);
    expect(byLabel("เชื่อมต่อ Google Sheets")?.permission).toBe("integrationManage");
    expect(byLabel("Audit Log")?.permission).toBe("auditRead");
    expect(byLabel("ตั้งค่าระบบ")?.permission).toBe("settingsManage");
    // เมนูอ่านทั่วไปต้องไม่มี permission (executive เห็นได้)
    expect(byLabel("Executive Overview")?.permission).toBeUndefined();
    expect(byLabel("งานทั้งหมด")?.permission).toBeUndefined();
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
