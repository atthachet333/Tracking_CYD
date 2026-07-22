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

  it("ยังมีเมนูที่ต้องคงไว้ + เมนูใหม่", () => {
    expect(labels).toContain("งานทั้งหมด");
    expect(labels).toContain("ภาพรวมลูกค้าและสถานะเคส");
    expect(labels).toContain("ลูกค้า");
    expect(labels).toContain("รายงานและวิเคราะห์");
    expect(labels).toContain("การแจ้งเตือน");
    expect(labels).toContain("ตั้งค่าระบบ");
    // Google Sheets Integration ยังเข้าถึงได้จาก Sidebar
    expect(routes).toContain("/dashboard/settings/integrations/google-sheets");
    expect(routes).toContain("/dashboard/customer-overview");
    expect(routes).toContain("/dashboard/tasks");
  });

  it("เปลี่ยนชื่อทีมเป็น 'ภาพรวมแอดมินและเอกสาร' + เพิ่มเมนูแผนกเอกสาร", () => {
    expect(labels).toContain("ภาพรวมแอดมินและเอกสาร");
    expect(labels).not.toContain("ภาพรวมทีมงานและแผนก");
    expect(labels).not.toContain("ภาพรวมทีมงานและเอกสาร");
    expect(labels).toContain("ภาพรวมแผนกเอกสาร");
    expect(routes).toContain("/dashboard/documents-overview");
  });

  it("ไม่มี route ซ้ำ", () => {
    expect(new Set(routes).size).toBe(routes.length);
  });
});
