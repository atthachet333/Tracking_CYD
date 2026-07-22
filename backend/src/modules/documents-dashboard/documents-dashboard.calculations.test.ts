import { describe, it, expect } from "vitest";
import type { DocumentTaskItem, CustomerStatusGroup } from "@tracking-cyd/shared";
import {
  computeSummary, computeAssignees, computeCompanies, computeActualBreakdown, computeTrends, filterItems, toPeriod,
} from "./documents-dashboard.calculations";

let seq = 0;
function mk(group: CustomerStatusGroup, over: Partial<DocumentTaskItem> = {}): DocumentTaskItem {
  seq++;
  return {
    workDate: over.workDate ?? null,
    caseNo: over.caseNo ?? `D-${seq}`,
    company: over.company ?? `Co ${seq}`,
    assignee: over.assignee ?? "พี่แอน",
    detail: over.detail ?? "",
    paymentStatus: over.paymentStatus ?? "",
    paymentGroup: over.paymentGroup ?? "unpaid",
    actualStatus: over.actualStatus ?? group,
    statusGroup: group,
    latestFollowUp: over.latestFollowUp ?? "",
    quotationLink: over.quotationLink ?? "",
    contractLink: over.contractLink ?? "",
    sourceSheet: "DOCUMENTS",
    sourceRow: seq,
  };
}

describe("computeSummary", () => {
  it("นับกลุ่ม + companies/employees ไม่ซ้ำ + rates", () => {
    const items = [
      mk("completed", { company: "A", assignee: "พี่แอน" }),
      mk("completed", { company: "a ", assignee: "พี่อัง" }), // company ซ้ำ (normalize)
      mk("issues", { company: "B", assignee: "พี่แอน" }),
      mk("in_progress", { company: "C", assignee: "สนุ๊ก" }),
    ];
    const s = computeSummary(items);
    expect(s.totalItems).toBe(4);
    expect(s.completed).toBe(2);
    expect(s.issues).toBe(1);
    expect(s.inProgress).toBe(1);
    expect(s.uniqueCompanies).toBe(3); // a,b,c
    expect(s.totalEmployees).toBe(3);  // พี่แอน,พี่อัง,สนุ๊ก
    expect(s.completionRate).toBe(50);
    expect(s.issueRate).toBe(25);
  });
  it("ว่าง → 0 ทั้งหมด", () => {
    const s = computeSummary([]);
    expect(s.totalItems).toBe(0);
    expect(s.completionRate).toBe(0);
  });
});

describe("computeAssignees / computeCompanies", () => {
  const items = [
    mk("completed", { assignee: "พี่แอน", company: "A", workDate: "2026-06-01" }),
    mk("issues", { assignee: "พี่แอน", company: "B", workDate: "2026-06-05" }),
    mk("completed", { assignee: "สนุ๊ก", company: "A", workDate: "2026-06-03" }),
  ];
  it("assignee stats + workload level", () => {
    const a = computeAssignees(items);
    expect(a[0].assignee).toBe("พี่แอน");
    expect(a[0].total).toBe(2);
    expect(a[0].companies).toBe(2);
    expect(a[0].workloadLevel).toBe("normal");
    expect(a[0].latestDate).toBe("2026-06-05");
  });
  it("company stats", () => {
    const c = computeCompanies(items);
    expect(c[0].company).toBe("A");
    expect(c[0].total).toBe(2);
    expect(c[0].assignees.sort()).toEqual(["พี่แอน", "สนุ๊ก"]);
  });
});

describe("computeActualBreakdown", () => {
  it("นับค่าดิบเรียงมากไปน้อย", () => {
    const items = [mk("completed", { actualStatus: "ดำเนินการเรียบร้อย" }), mk("completed", { actualStatus: "ดำเนินการเรียบร้อย" }), mk("issues", { actualStatus: "เอกสารไม่ครบ" })];
    const b = computeActualBreakdown(items);
    expect(b[0]).toEqual({ status: "ดำเนินการเรียบร้อย", count: 2, group: "completed" });
  });
});

describe("toPeriod + computeTrends", () => {
  it("รองรับ dd/mm/yyyy และปี พ.ศ.", () => {
    expect(toPeriod("08/06/2026")).toBe("2026-06");
    expect(toPeriod("2026-07-15")).toBe("2026-07");
    expect(toPeriod("05/06/2569")).toBe("2026-06"); // พ.ศ. → ค.ศ.
    expect(toPeriod("")).toBeNull();
  });
  it("trends รายเดือน", () => {
    const items = [mk("completed", { workDate: "08/06/2026" }), mk("issues", { workDate: "10/06/2026" }), mk("completed", { workDate: "01/07/2026" })];
    const t = computeTrends(items);
    expect(t).toEqual([
      { period: "2026-06", total: 2, completed: 1, issues: 1 },
      { period: "2026-07", total: 1, completed: 1, issues: 0 },
    ]);
  });
});

describe("filterItems", () => {
  const items = [
    mk("completed", { assignee: "พี่แอน", company: "Alpha", actualStatus: "ดำเนินการเรียบร้อย", workDate: "2026-06-01" }),
    mk("issues", { assignee: "สนุ๊ก", company: "Beta", actualStatus: "เอกสารไม่ครบ", workDate: "2026-06-10" }),
  ];
  it("filter statusGroup/assignee/company/search + pagination", () => {
    expect(filterItems(items, { statusGroup: "issues", page: 1, pageSize: 20 }).pagination.total).toBe(1);
    expect(filterItems(items, { assignee: "สนุ๊ก", page: 1, pageSize: 20 }).pagination.total).toBe(1);
    expect(filterItems(items, { company: "alpha", page: 1, pageSize: 20 }).pagination.total).toBe(1);
    expect(filterItems(items, { search: "เอกสาร", page: 1, pageSize: 20 }).pagination.total).toBe(1);
  });
  it("filter dateFrom + sort", () => {
    const r = filterItems(items, { dateFrom: "2026-06-05", page: 1, pageSize: 20, sortBy: "workDate", sortOrder: "asc" });
    expect(r.pagination.total).toBe(1);
    expect(r.data[0].caseNo).toBe(items[1].caseNo);
  });
});
