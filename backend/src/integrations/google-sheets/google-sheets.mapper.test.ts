import { describe, it, expect } from "vitest";
import { mapRowsToCases } from "./google-sheets.mapper";

describe("mapRowsToCases", () => {
  it("map แถวข้อมูลอังกฤษเป็น CaseRow", () => {
    const headers = ["Case No", "Customer", "Status", "Assignee", "Due Date", "Amount"];
    const rows = [["C-001", "ACME", "In Progress", "สมชาย", "15/07/2569", "1,000"]];
    const { cases, warnings } = mapRowsToCases(headers, rows);
    expect(cases).toHaveLength(1);
    expect(cases[0].caseNo).toBe("C-001");
    expect(cases[0].customerName).toBe("ACME");
    expect(cases[0].assignee).toBe("สมชาย");
    expect(cases[0].dueDate).toBe("2026-07-15");
    expect(cases[0].amount).toBe(1000);
    expect(warnings).toHaveLength(0);
  });

  it("map แถวข้อมูลไทย + derived status = done เมื่อสถานะเป็นเสร็จ", () => {
    const headers = ["รหัสเคส", "ลูกค้า", "สถานะ"];
    const rows = [["ค-002", "บ.ทดสอบ", "เสร็จสิ้น"]];
    const { cases } = mapRowsToCases(headers, rows);
    expect(cases[0].derivedStatus).toBe("done");
  });

  it("เพิ่ม warning เมื่อไม่มี header จำเป็น", () => {
    const headers = ["Foo", "Bar"];
    const { warnings } = mapRowsToCases(headers, [["a", "b"]]);
    const fields = warnings.map((w) => w.field);
    expect(fields).toContain("caseNo");
    expect(fields).toContain("customerName");
    expect(fields).toContain("status");
  });

  it("ข้ามแถวว่างทั้งหมด", () => {
    const headers = ["Case No", "Customer", "Status"];
    const rows = [["", "", ""], ["C-1", "X", "wait"]];
    const { cases } = mapRowsToCases(headers, rows);
    expect(cases).toHaveLength(1);
  });
});
