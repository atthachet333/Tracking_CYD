import { describe, it, expect } from "vitest";
import type { CustomerCaseItem, DocumentTaskItem } from "@tracking-cyd/shared";
import { adminToUnified, documentToUnified } from "./unified-tasks.adapter";

const admin: CustomerCaseItem = {
  date: "2026-06-01", caseNo: "C-1", company: "Alpha", assignee: "พี่คิม", initialDetail: "รายละเอียด",
  quotation: "", quotationLink: "https://q/1", followUp1: "", followUp2: "", followUp3: "ตามแล้ว",
  customerStatus: "ลงนามแล้ว", statusGroup: "completed", deposit: "", contractDraft: "", contractLink: "not-a-url",
  latestFollowUp: "ตามแล้ว", sourceSheet: "พี่คิม", sourceRow: 5,
};

const doc: DocumentTaskItem = {
  workDate: "08/06/2026", caseNo: "D-1", company: "Beta", assignee: "พี่แอน", detail: "งานเอกสาร",
  actualStatus: "ดำเนินการเรียบร้อย", statusGroup: "completed", latestFollowUp: "",
  quotationLink: "", contractLink: "https://c/9", sourceSheet: "DOCUMENTS", sourceRow: 3,
};

describe("unified adapter", () => {
  it("adminToUnified: department=admin + links กรองเฉพาะ URL", () => {
    const u = adminToUnified(admin);
    expect(u.department).toBe("admin");
    expect(u.companyName).toBe("Alpha");
    expect(u.actualStatus).toBe("ลงนามแล้ว");
    expect(u.links).toEqual(["https://q/1"]); // contractLink "not-a-url" ถูกกรองทิ้ง
    expect(u.id).toBe("admin-พี่คิม-5");
  });
  it("documentToUnified: department=documents", () => {
    const u = documentToUnified(doc);
    expect(u.department).toBe("documents");
    expect(u.companyName).toBe("Beta");
    expect(u.statusGroup).toBe("completed");
    expect(u.links).toEqual(["https://c/9"]);
    expect(u.id).toBe("documents-DOCUMENTS-3");
  });
});
