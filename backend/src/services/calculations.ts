/* ============================================================
   Dashboard Calculations (pure functions, testable)
   คำนวณ KPI ทั้งหมดจาก CaseRow[] จริง — คืนค่า 0/[] เมื่อไม่มีข้อมูล
   ห้าม hardcode ตัวเลขใด ๆ
   ============================================================ */
import type {
  CaseRow, DashboardSummary, TrendPoint, Insight, Employee, Customer,
  Department, ServiceType, Task, LoadLevel, CustomerTier,
} from "@tracking-cyd/shared";

const THAI_MONTH_ABBR = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const PALETTE = ["#1D4ED8", "#0D9488", "#7C3AED", "#F59E0B", "#EF4444", "#16A34A", "#2563EB", "#9333EA"];

const round1 = (n: number) => Math.round(n * 10) / 10;
const pct = (part: number, total: number) => (total > 0 ? round1((part / total) * 100) : 0);
const isDone = (c: CaseRow) => c.derivedStatus === "done";

function mostFrequent(values: string[]): string {
  const counts = new Map<string, number>();
  for (const v of values) {
    if (!v) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  let best = "";
  let max = 0;
  for (const [k, n] of counts) if (n > max) { max = n; best = k; }
  return best;
}

/** on-time = เคสที่ปิดแล้วและปิดไม่เกินกำหนด / เคสที่ปิดทั้งหมด */
export function calculateSlaMetrics(cases: CaseRow[]): { onTimeRate: number; overdueRate: number; completionRate: number } {
  const total = cases.length;
  const done = cases.filter(isDone);
  const onTime = done.filter((c) => !c.dueDate || !c.closedDate || c.closedDate <= c.dueDate).length;
  const overdue = cases.filter((c) => c.derivedStatus === "over").length;
  return {
    onTimeRate: pct(onTime, done.length),
    overdueRate: pct(overdue, total),
    completionRate: pct(done.length, total),
  };
}

export function calculateWorkloadByEmployee(cases: CaseRow[]): Employee[] {
  const byAssignee = new Map<string, CaseRow[]>();
  for (const c of cases) {
    if (!c.assignee) continue;
    const list = byAssignee.get(c.assignee) ?? [];
    list.push(c);
    byAssignee.set(c.assignee, list);
  }
  let id = 0;
  return [...byAssignee.entries()].map(([name, list]) => {
    const done = list.filter(isDone).length;
    const active = list.length - done;
    const sla = calculateSlaMetrics(list).onTimeRate;
    const load: LoadLevel = active >= 15 ? "high" : active >= 8 ? "mid" : "low";
    return {
      id: ++id,
      name,
      role: "ผู้รับผิดชอบงาน",
      dept: mostFrequent(list.map((c) => c.department)) || "-",
      load,
      active,
      done,
      sla,
      online: false,
      img: 0,
      perf: pct(done, list.length),
      email: "",
      phone: "",
      trend: [],
      leaveLeft: 0,
      joinYear: "",
    };
  });
}

export function calculateCustomers(cases: CaseRow[]): Customer[] {
  const byCustomer = new Map<string, CaseRow[]>();
  for (const c of cases) {
    if (!c.customerName) continue;
    const list = byCustomer.get(c.customerName) ?? [];
    list.push(c);
    byCustomer.set(c.customerName, list);
  }
  let id = 0;
  return [...byCustomer.entries()].map(([name, list]) => {
    const value = list.reduce((s, c) => s + c.amount, 0);
    const tier: CustomerTier = value >= 400000 ? "Platinum" : value >= 150000 ? "Gold" : "Silver";
    return {
      id: ++id,
      name,
      type: mostFrequent(list.map((c) => c.serviceType)) || "-",
      tier,
      cases: list.length,
      docs: list.length,
      pending: list.filter((c) => !isDone(c)).length,
      sla: calculateSlaMetrics(list).onTimeRate,
      value,
      contact: "",
    };
  });
}

export function calculateDepartmentPerformance(cases: CaseRow[]): Department[] {
  const byDept = new Map<string, CaseRow[]>();
  for (const c of cases) {
    if (!c.department) continue;
    const list = byDept.get(c.department) ?? [];
    list.push(c);
    byDept.set(c.department, list);
  }
  let i = 0;
  return [...byDept.entries()].map(([name, list]) => ({
    id: name.replace(/\s+/g, "-").toLowerCase() || `dept-${i}`,
    name,
    head: mostFrequent(list.map((c) => c.assignee)) || "",
    count: list.length,
    sla: calculateSlaMetrics(list).onTimeRate,
    color: PALETTE[i++ % PALETTE.length],
  }));
}

export function calculateServiceDistribution(cases: CaseRow[]): ServiceType[] {
  const byType = new Map<string, number>();
  for (const c of cases) {
    if (!c.serviceType) continue;
    byType.set(c.serviceType, (byType.get(c.serviceType) ?? 0) + 1);
  }
  const total = [...byType.values()].reduce((s, n) => s + n, 0);
  let i = 0;
  return [...byType.entries()].map(([name, count]) => ({
    name,
    count,
    pct: pct(count, total),
    color: PALETTE[i++ % PALETTE.length],
  }));
}

export function calculateMonthlyTrends(cases: CaseRow[]): TrendPoint[] {
  const byMonth = new Map<string, CaseRow[]>();
  for (const c of cases) {
    const iso = c.closedDate ?? c.createdDate;
    if (!iso) continue;
    const key = iso.slice(0, 7); // YYYY-MM
    const list = byMonth.get(key) ?? [];
    list.push(c);
    byMonth.set(key, list);
  }
  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([key, list]) => {
      const month = Number(key.slice(5, 7));
      return {
        month: THAI_MONTH_ABBR[month - 1] ?? key,
        done: list.filter(isDone).length,
        sla: calculateSlaMetrics(list).onTimeRate,
      };
    });
}

export function casesToTasks(cases: CaseRow[]): Task[] {
  const statusText: Record<string, string> = {
    wait: "รอดำเนินการ", prog: "กำลังดำเนินการ", near: "ใกล้ครบกำหนด", over: "เกินกำหนด", done: "เสร็จสิ้น",
  };
  return cases.map((c) => ({
    id: c.caseNo,
    title: c.serviceType || c.documentType || c.caseNo,
    customer: c.customerName,
    owner: c.assignee,
    ownerImg: 0,
    status: c.derivedStatus,
    statusText: c.status || statusText[c.derivedStatus],
    due: c.dueDate ?? "-",
    progress: c.progress,
    priority: c.derivedStatus === "over" ? "high" : c.derivedStatus === "near" ? "mid" : "low",
    sla: 0,
  }));
}

export function calculateInsights(cases: CaseRow[]): Insight[] {
  if (cases.length < 5) {
    return [{
      type: "info",
      icon: "clock",
      title: "ยังไม่มีข้อมูลเพียงพอสำหรับการวิเคราะห์",
      desc: "เพิ่มข้อมูลใน Google Sheets แล้วกดรีเฟรชเพื่อให้ระบบสรุป Insight ให้อัตโนมัติ",
    }];
  }
  const insights: Insight[] = [];
  const sla = calculateSlaMetrics(cases);
  const overdue = cases.filter((c) => c.derivedStatus === "over").length;

  if (overdue > 0) {
    insights.push({ type: "danger", icon: "alert", title: `มีงานเกินกำหนด ${overdue} รายการ`, desc: "ควรจัดลำดับความสำคัญและติดตามงานกลุ่มนี้ก่อน" });
  }
  insights.push({
    type: sla.onTimeRate >= 95 ? "success" : "warn",
    icon: sla.onTimeRate >= 95 ? "up" : "trend",
    title: `อัตราส่งงานตรงเวลา ${sla.onTimeRate}%`,
    desc: sla.onTimeRate >= 95 ? "อยู่ในเกณฑ์ดีกว่าเป้าหมาย" : "ต่ำกว่าเป้าหมาย ควรทบทวนภาระงาน",
  });
  const emps = calculateWorkloadByEmployee(cases).sort((a, b) => b.active - a.active);
  if (emps.length > 0 && emps[0].active >= 10) {
    insights.push({ type: "warn", icon: "trend", title: `${emps[0].name} มีภาระงานสูง (${emps[0].active} งาน)`, desc: "พิจารณากระจายงานไปยังผู้ที่มีภาระต่ำกว่า" });
  }
  return insights;
}

export function calculateDashboardSummary(cases: CaseRow[]): DashboardSummary {
  const employees = calculateWorkloadByEmployee(cases);
  const customers = calculateCustomers(cases);
  const sla = calculateSlaMetrics(cases);
  const highLoad = employees.filter((e) => e.load === "high").length;
  const byStatus = (s: string) => cases.filter((c) => c.derivedStatus === s).length;

  return {
    totalEmployees: employees.length,
    onlineToday: 0,
    highLoad,
    onLeave: 0,
    avgPerf: sla.completionRate,
    teamSla: sla.onTimeRate,
    inProgress: byStatus("prog"),
    docsClosed: byStatus("done"),
    totalTasks: cases.length,
    doneTasks: byStatus("done"),
    totalCustomers: customers.length,
    serviceValue: customers.reduce((s, c) => s + c.value, 0),
    loadDistribution: {
      high: highLoad,
      mid: employees.filter((e) => e.load === "mid").length,
      low: employees.filter((e) => e.load === "low").length,
    },
    weeklyAttendance: [],
    training: { total: 0, done: 0 },
    capacity: employees.length ? Math.round((highLoad / employees.length) * 100) : 0,
    burnoutRisk: highLoad,
    workloadForecast: 0,
    topPerformers: [...employees]
      .sort((a, b) => b.perf - a.perf)
      .slice(0, 5)
      .map((e) => ({ id: e.id, name: e.name, role: e.role, img: e.img, perf: e.perf })),
  };
}
