import { describe, it, expect } from "vitest";
import type { CaseRow } from "@tracking-cyd/shared";
import {
  calculateDashboardSummary, calculateSlaMetrics, calculateWorkloadByEmployee, calculateInsights,
} from "./calculations";

function makeCase(over: Partial<CaseRow>): CaseRow {
  return {
    caseNo: "C-1", customerName: "ลูกค้า A", status: "", derivedStatus: "wait", assignee: "สมชาย",
    department: "Admin", serviceType: "บัญชี", documentType: "", dueDate: null, createdDate: "2026-07-01",
    closedDate: null, progress: 0, sla: "", amount: 0, raw: {}, ...over,
  };
}

describe("calculateDashboardSummary (empty)", () => {
  it("ข้อมูลว่าง → KPI เป็น 0 ทั้งหมด", () => {
    const s = calculateDashboardSummary([]);
    expect(s.totalTasks).toBe(0);
    expect(s.totalEmployees).toBe(0);
    expect(s.totalCustomers).toBe(0);
    expect(s.teamSla).toBe(0);
    expect(s.serviceValue).toBe(0);
    expect(s.loadDistribution).toEqual({ high: 0, mid: 0, low: 0 });
  });
});

describe("calculateDashboardSummary (มีข้อมูล)", () => {
  const cases: CaseRow[] = [
    makeCase({ caseNo: "C-1", derivedStatus: "done", closedDate: "2026-07-05", dueDate: "2026-07-10", amount: 100000 }),
    makeCase({ caseNo: "C-2", derivedStatus: "prog", assignee: "สมหญิง", customerName: "ลูกค้า B", amount: 50000 }),
    makeCase({ caseNo: "C-3", derivedStatus: "over", assignee: "สมชาย", dueDate: "2026-07-01" }),
  ];
  it("นับงานและ distinct ถูกต้อง", () => {
    const s = calculateDashboardSummary(cases);
    expect(s.totalTasks).toBe(3);
    expect(s.doneTasks).toBe(1);
    expect(s.inProgress).toBe(1);
    expect(s.totalEmployees).toBe(2);
    expect(s.totalCustomers).toBe(2);
    expect(s.serviceValue).toBe(150000);
  });
  it("SLA on-time rate", () => {
    const m = calculateSlaMetrics(cases);
    expect(m.completionRate).toBeGreaterThan(0);
    expect(m.onTimeRate).toBe(100); // งานที่ปิด ปิดก่อนกำหนด
  });
  it("workload per employee", () => {
    const emps = calculateWorkloadByEmployee(cases);
    const somchai = emps.find((e) => e.name === "สมชาย");
    expect(somchai?.active).toBe(1);
    expect(somchai?.done).toBe(1);
  });
});

describe("calculateInsights", () => {
  it("ข้อมูลน้อย → แจ้งว่าไม่พอสำหรับวิเคราะห์", () => {
    const insights = calculateInsights([]);
    expect(insights[0].title).toContain("ยังไม่มีข้อมูลเพียงพอ");
  });
});
