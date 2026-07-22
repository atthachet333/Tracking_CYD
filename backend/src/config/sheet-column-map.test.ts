import { describe, it, expect } from "vitest";
import { buildColumnMapping } from "./sheet-column-map";

describe("buildColumnMapping", () => {
  it("map header ภาษาอังกฤษได้", () => {
    const m = buildColumnMapping(["Case No", "Customer Name", "Status", "Assignee", "Due Date"]);
    expect(m.caseNo).toBe("Case No");
    expect(m.customerName).toBe("Customer Name");
    expect(m.status).toBe("Status");
    expect(m.assignee).toBe("Assignee");
    expect(m.dueDate).toBe("Due Date");
  });

  it("map header ภาษาไทยได้", () => {
    const m = buildColumnMapping(["รหัสเคส", "ชื่อลูกค้า", "สถานะ", "ผู้รับผิดชอบ", "วันครบกำหนด"]);
    expect(m.caseNo).toBe("รหัสเคส");
    expect(m.customerName).toBe("ชื่อลูกค้า");
    expect(m.status).toBe("สถานะ");
    expect(m.assignee).toBe("ผู้รับผิดชอบ");
    expect(m.dueDate).toBe("วันครบกำหนด");
  });

  it("ไม่พบ header → null", () => {
    const m = buildColumnMapping(["Foo", "Bar"]);
    expect(m.caseNo).toBeNull();
    expect(m.status).toBeNull();
  });

  it("ทนต่อช่องว่าง/ตัวพิมพ์", () => {
    const m = buildColumnMapping(["  case no  ", "STATUS"]);
    expect(m.caseNo).toBe("  case no  ");
    expect(m.status).toBe("STATUS");
  });
});
