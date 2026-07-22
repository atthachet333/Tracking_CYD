// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import type { CustomerCaseItem } from "@/types/customer-dashboard";
import { RecentCasesTable } from "./RecentCasesTable";

function mkCase(over: Partial<CustomerCaseItem>): CustomerCaseItem {
  return {
    date: null, caseNo: "", company: "", assignee: "", initialDetail: "", quotation: "", quotationLink: "",
    followUp1: "", followUp2: "", followUp3: "", customerStatus: "", statusGroup: "unclassified",
    deposit: "", contractDraft: "", contractLink: "", latestFollowUp: "", sourceSheet: "", sourceRow: 0, ...over,
  };
}

const cases: CustomerCaseItem[] = [
  mkCase({ date: "2026-06-01", caseNo: "C-1", company: "Alpha", assignee: "พี่คิม", customerStatus: "ลงนามแล้ว", statusGroup: "completed", sourceSheet: "พี่คิม", sourceRow: 2 }),
  mkCase({ date: "2026-06-02", caseNo: "C-2", company: "Beta", assignee: "แอม", customerStatus: "ลูกค้าปฏิเสธ", statusGroup: "issues", sourceSheet: "แอม", sourceRow: 3 }),
];

afterEach(cleanup);

describe("RecentCasesTable", () => {
  it("Empty → ข้อความว่างเมื่อไม่มีเคส", () => {
    render(<RecentCasesTable cases={[]} filter={null} />);
    expect(screen.getByText(/ไม่มีเคส/)).not.toBeNull();
  });

  it("แสดงทุกเคสเมื่อ filter = null", () => {
    render(<RecentCasesTable cases={cases} filter={null} />);
    expect(screen.getByText("Alpha")).not.toBeNull();
    expect(screen.getByText("Beta")).not.toBeNull();
  });

  it("กรองตามกลุ่มเมื่อ drill-down (issues)", () => {
    render(<RecentCasesTable cases={cases} filter="issues" />);
    expect(screen.queryByText("Alpha")).toBeNull();
    expect(screen.getByText("Beta")).not.toBeNull();
  });
});
