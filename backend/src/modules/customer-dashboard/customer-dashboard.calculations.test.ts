import { describe, it, expect } from "vitest";
import type { CustomerCaseItem, CustomerStatusGroup } from "@tracking-cyd/shared";
import {
  computeSummary,
  computeDistribution,
  computeActualBreakdown,
  computeTrends,
  computeInsights,
  filterProblemCases,
  filterCustomers,
  casesInGroup,
} from "./customer-dashboard.calculations";

let seq = 0;
function mk(group: CustomerStatusGroup, over: Partial<CustomerCaseItem> = {}): CustomerCaseItem {
  seq++;
  return {
    date: over.date ?? null,
    caseNo: over.caseNo ?? `C-${seq}`,
    company: over.company ?? `Co ${seq}`,
    assignee: over.assignee ?? "พี่คิม",
    initialDetail: over.initialDetail ?? "",
    quotation: over.quotation ?? "",
    quotationLink: over.quotationLink ?? "",
    followUp1: over.followUp1 ?? "",
    followUp2: over.followUp2 ?? "",
    followUp3: over.followUp3 ?? "",
    customerStatus: over.customerStatus ?? group,
    statusGroup: group,
    deposit: over.deposit ?? "",
    contractDraft: over.contractDraft ?? "",
    contractLink: over.contractLink ?? "",
    latestFollowUp: over.latestFollowUp ?? "",
    sourceSheet: over.sourceSheet ?? "พี่คิม",
    sourceRow: over.sourceRow ?? seq,
  };
}

describe("computeSummary + percentages", () => {
  it("นับตามกลุ่มและคำนวณ rate", () => {
    const cases = [
      ...Array.from({ length: 5 }, () => mk("in_progress")),
      ...Array.from({ length: 3 }, () => mk("completed")),
      ...Array.from({ length: 2 }, () => mk("issues")),
    ];
    const s = computeSummary(cases);
    expect(s.totalCustomers).toBe(10);
    expect(s.inProgress).toBe(5);
    expect(s.completed).toBe(3);
    expect(s.issues).toBe(2);
    expect(s.unclassified).toBe(0);
    expect(s.completionRate).toBe(30);
    expect(s.issueRate).toBe(20);
    expect(s.inProgressRate).toBe(50);
    expect(s.uniqueCases).toBe(10);
  });

  it("นับบริษัท/เคสไม่ซ้ำ (business key)", () => {
    const cases = [
      mk("completed", { caseNo: "C-1", company: "Alpha" }),
      mk("issues", { caseNo: "C-1", company: "alpha " }), // เคสซ้ำ + บริษัทซ้ำ (normalize)
      mk("in_progress", { caseNo: "C-2", company: "Beta" }),
    ];
    const s = computeSummary(cases);
    expect(s.totalCustomers).toBe(3);   // นับทุก record
    expect(s.uniqueCases).toBe(2);      // C-1, C-2
    expect(s.uniqueCompanies).toBe(2);  // alpha (normalize), beta
  });

  it("sheet ว่าง → ทุกค่าเป็น 0 (ไม่หารด้วยศูนย์)", () => {
    const s = computeSummary([]);
    expect(s).toEqual({
      totalCustomers: 0, uniqueCompanies: 0, uniqueCases: 0, inProgress: 0, completed: 0, issues: 0, unclassified: 0,
      completionRate: 0, issueRate: 0, inProgressRate: 0,
    });
  });
});

describe("filterCustomers + casesInGroup", () => {
  const cases = [
    mk("completed", { caseNo: "C-1", company: "Alpha", assignee: "พี่คิม", customerStatus: "ลงนามแล้ว", date: "2026-06-01" }),
    mk("issues", { caseNo: "C-2", company: "Beta", assignee: "แอม", customerStatus: "ลูกค้าปฏิเสธ", date: "2026-05-01" }),
    mk("in_progress", { caseNo: "C-3", company: "Gamma", assignee: "พี่คิม", customerStatus: "รอพิจารณา", date: "2026-06-15" }),
  ];

  it("filter statusGroup + assignee", () => {
    expect(filterCustomers(cases, { statusGroup: "in_progress", page: 1, pageSize: 20 }).pagination.total).toBe(1);
    expect(filterCustomers(cases, { assignee: "พี่คิม", page: 1, pageSize: 20 }).pagination.total).toBe(2);
  });
  it("filter dateFrom/dateTo + sort", () => {
    const r = filterCustomers(cases, { dateFrom: "2026-06-01", page: 1, pageSize: 20, sortBy: "date", sortOrder: "asc" });
    expect(r.pagination.total).toBe(2);
    expect(r.data[0].caseNo).toBe("C-1");
  });
  it("search จับหลายคอลัมน์", () => {
    expect(filterCustomers(cases, { search: "beta", page: 1, pageSize: 20 }).pagination.total).toBe(1);
  });
  it("casesInGroup คืนเฉพาะกลุ่ม", () => {
    expect(casesInGroup(cases, "completed").map((c) => c.caseNo)).toEqual(["C-1"]);
  });
});

describe("computeDistribution", () => {
  it("คืน 4 กลุ่มเสมอ + percentage รวม ~100", () => {
    const cases = [mk("in_progress"), mk("completed"), mk("issues"), mk("unclassified")];
    const dist = computeDistribution(cases);
    expect(dist.map((d) => d.key)).toEqual(["in_progress", "completed", "issues", "unclassified"]);
    expect(dist.every((d) => d.count === 1 && d.percentage === 25)).toBe(true);
  });
});

describe("computeActualBreakdown", () => {
  it("นับค่าสถานะดิบ เรียงมากไปน้อย พร้อมกลุ่ม", () => {
    const cases = [
      mk("issues", { customerStatus: "ลูกค้าปฏิเสธ" }),
      mk("issues", { customerStatus: "ลูกค้าปฏิเสธ" }),
      mk("completed", { customerStatus: "ลงนามแล้ว" }),
    ];
    const actual = computeActualBreakdown(cases);
    expect(actual[0]).toEqual({ status: "ลูกค้าปฏิเสธ", count: 2, group: "issues" });
    expect(actual[1]).toEqual({ status: "ลงนามแล้ว", count: 1, group: "completed" });
  });
});

describe("computeTrends", () => {
  it("จัดกลุ่มรายเดือนเฉพาะเคสที่มีวันที่ ISO", () => {
    const cases = [
      mk("completed", { date: "2026-05-10" }),
      mk("issues", { date: "2026-05-20" }),
      mk("completed", { date: "2026-06-01" }),
      mk("in_progress", { date: null }), // ไม่มีวันที่ → ไม่นับใน trend
    ];
    const t = computeTrends(cases);
    expect(t).toEqual([
      { period: "2026-05", total: 2, completed: 1, issues: 1 },
      { period: "2026-06", total: 1, completed: 1, issues: 0 },
    ]);
  });
});

describe("computeInsights (rule-based)", () => {
  it("ไม่มีข้อมูล → ข้อความ 'ยังไม่มีข้อมูลเพียงพอ'", () => {
    const ins = computeInsights(computeSummary([]), []);
    expect(ins[0].desc).toContain("ยังไม่มีข้อมูลเพียงพอ");
  });
  it("issueRate สูง + unclassified > 0 → มี danger และ warn", () => {
    const cases = [
      ...Array.from({ length: 5 }, () => mk("issues")),
      ...Array.from({ length: 3 }, () => mk("unclassified")),
      ...Array.from({ length: 2 }, () => mk("completed")),
    ];
    const ins = computeInsights(computeSummary(cases), []);
    expect(ins.some((i) => i.type === "danger")).toBe(true);
    expect(ins.some((i) => i.type === "warn")).toBe(true);
  });
});

describe("filterProblemCases", () => {
  const cases = [
    ...Array.from({ length: 25 }, (_, i) => mk("issues", { caseNo: `X-${i}`, customerStatus: "ลูกค้าปฏิเสธ" })),
    mk("issues", { caseNo: "Y-1", company: "SpecialCorp", customerStatus: "ไม่มีการตอบกลับ" }),
    mk("completed"),
    mk("in_progress"),
  ];

  it("คืนเฉพาะกลุ่ม issues + pagination", () => {
    const { data, pagination } = filterProblemCases(cases, { page: 1, pageSize: 20 });
    expect(pagination.total).toBe(26);
    expect(pagination.totalPages).toBe(2);
    expect(data).toHaveLength(20);
    expect(data.every((c) => c.statusGroup === "issues")).toBe(true);
  });

  it("search จับ company/สถานะ", () => {
    const { data, pagination } = filterProblemCases(cases, { page: 1, pageSize: 20, search: "special" });
    expect(pagination.total).toBe(1);
    expect(data[0].company).toBe("SpecialCorp");
  });

  it("status filter จับค่าดิบ", () => {
    const { pagination } = filterProblemCases(cases, { page: 1, pageSize: 20, status: "ตอบกลับ" });
    expect(pagination.total).toBe(1);
  });
});
