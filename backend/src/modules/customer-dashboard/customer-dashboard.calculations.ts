/* ============================================================
   Customer Dashboard Calculations (pure)
   - ไม่มี I/O — รับ CustomerCaseItem[] แล้วคืน metrics
   ============================================================ */
import type {
  CustomerCaseItem,
  CustomerDashboardSummary,
  CustomerStatusDistributionItem,
  CustomerActualStatusItem,
  CustomerStatusGroup,
  CustomerTrendPoint,
  CustomerInsight,
  Pagination,
} from "@tracking-cyd/shared";
import { GROUP_LABELS, GROUP_ORDER } from "./customer-status.config";

function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 10000) / 100; // ทศนิยม 2 ตำแหน่ง
}

/** normalize ชื่อบริษัทสำหรับนับไม่ซ้ำ (business key fallback) */
function normalizeCompany(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

export function computeSummary(cases: CustomerCaseItem[]): CustomerDashboardSummary {
  const total = cases.length;
  const inProgress = cases.filter((c) => c.statusGroup === "in_progress").length;
  const completed = cases.filter((c) => c.statusGroup === "completed").length;
  const issues = cases.filter((c) => c.statusGroup === "issues").length;
  const unclassified = cases.filter((c) => c.statusGroup === "unclassified").length;

  const companies = new Set<string>();
  const caseNos = new Set<string>();
  for (const c of cases) {
    if (c.company.trim()) companies.add(normalizeCompany(c.company));
    if (c.caseNo.trim()) caseNos.add(c.caseNo.trim());
  }

  return {
    totalCustomers: total,
    uniqueCompanies: companies.size,
    uniqueCases: caseNos.size,
    inProgress,
    completed,
    issues,
    unclassified,
    completionRate: pct(completed, total),
    issueRate: pct(issues, total),
    inProgressRate: pct(inProgress, total),
  };
}

/** คืนเคสของกลุ่มที่ระบุ (เรียงล่าสุดก่อน) */
export function casesInGroup(cases: CustomerCaseItem[], group: CustomerStatusGroup): CustomerCaseItem[] {
  return computeRecentCases(cases.filter((c) => c.statusGroup === group), Number.MAX_SAFE_INTEGER);
}

export function computeDistribution(cases: CustomerCaseItem[]): CustomerStatusDistributionItem[] {
  const total = cases.length;
  const counts = new Map<CustomerStatusGroup, number>();
  for (const c of cases) counts.set(c.statusGroup, (counts.get(c.statusGroup) ?? 0) + 1);
  return GROUP_ORDER.map((key) => {
    const count = counts.get(key) ?? 0;
    return { key, label: GROUP_LABELS[key], count, percentage: pct(count, total) };
  });
}

/** จำนวนตามค่าสถานะดิบจริง (สำหรับ bar chart) — เรียงมากไปน้อย */
export function computeActualBreakdown(cases: CustomerCaseItem[]): CustomerActualStatusItem[] {
  const counts = new Map<string, { count: number; group: CustomerStatusGroup }>();
  for (const c of cases) {
    const label = c.customerStatus.trim() || "(ไม่ระบุ)";
    const cur = counts.get(label);
    if (cur) cur.count++;
    else counts.set(label, { count: 1, group: c.statusGroup });
  }
  return [...counts.entries()]
    .map(([status, v]) => ({ status, count: v.count, group: v.group }))
    .sort((a, b) => b.count - a.count || a.status.localeCompare(b.status));
}

/** เรียงเคสล่าสุดตามวันที่ (ถ้ามี) แล้วตัด limit */
export function computeRecentCases(cases: CustomerCaseItem[], limit = 15): CustomerCaseItem[] {
  const withDate = [...cases].sort((a, b) => {
    const da = a.date ?? "";
    const db = b.date ?? "";
    if (da && db) return db.localeCompare(da);
    if (da) return -1;
    if (db) return 1;
    return b.sourceRow - a.sourceRow;
  });
  return withDate.slice(0, limit);
}

/** trend รายเดือนจากวันที่จริง (YYYY-MM) — เฉพาะเคสที่ parse วันที่ได้ */
export function computeTrends(cases: CustomerCaseItem[]): CustomerTrendPoint[] {
  const byPeriod = new Map<string, CustomerTrendPoint>();
  for (const c of cases) {
    if (!c.date) continue;
    const m = /^(\d{4})-(\d{2})/.exec(c.date);
    if (!m) continue;
    const period = `${m[1]}-${m[2]}`;
    const p = byPeriod.get(period) ?? { period, total: 0, completed: 0, issues: 0 };
    p.total++;
    if (c.statusGroup === "completed") p.completed++;
    if (c.statusGroup === "issues") p.issues++;
    byPeriod.set(period, p);
  }
  return [...byPeriod.values()].sort((a, b) => a.period.localeCompare(b.period));
}

export function filterProblemCases(
  cases: CustomerCaseItem[],
  opts: { search?: string; status?: string; page: number; pageSize: number },
): { data: CustomerCaseItem[]; pagination: Pagination } {
  let rows = cases.filter((c) => c.statusGroup === "issues");

  if (opts.status) {
    const s = opts.status.trim().toLowerCase();
    rows = rows.filter((c) => c.customerStatus.toLowerCase().includes(s));
  }
  if (opts.search) {
    const s = opts.search.trim().toLowerCase();
    rows = rows.filter((c) =>
      [c.caseNo, c.company, c.assignee, c.customerStatus].some((v) => v.toLowerCase().includes(s)),
    );
  }

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / opts.pageSize));
  const page = Math.min(Math.max(1, opts.page), totalPages);
  const data = rows.slice((page - 1) * opts.pageSize, page * opts.pageSize);
  return { data, pagination: { page, pageSize: opts.pageSize, total, totalPages } };
}

export interface CustomerFilterOpts {
  search?: string;
  status?: string;        // ค้นค่าดิบ (contains)
  statusGroup?: CustomerStatusGroup;
  assignee?: string;
  dateFrom?: string;      // เทียบ string (YYYY-MM-DD) — best-effort
  dateTo?: string;
  sortBy?: "date" | "caseNo" | "company" | "assignee" | "customerStatus";
  sortOrder?: "asc" | "desc";
  page: number;
  pageSize: number;
}

/** ตารางลูกค้าทั้งหมด: filter + sort + pagination */
export function filterCustomers(
  cases: CustomerCaseItem[],
  opts: CustomerFilterOpts,
): { data: CustomerCaseItem[]; pagination: Pagination } {
  let rows = cases;

  if (opts.statusGroup) rows = rows.filter((c) => c.statusGroup === opts.statusGroup);
  if (opts.assignee) {
    const a = opts.assignee.trim().toLowerCase();
    rows = rows.filter((c) => c.assignee.toLowerCase().includes(a));
  }
  if (opts.status) {
    const s = opts.status.trim().toLowerCase();
    rows = rows.filter((c) => c.customerStatus.toLowerCase().includes(s));
  }
  if (opts.dateFrom) rows = rows.filter((c) => (c.date ?? "") >= opts.dateFrom!);
  if (opts.dateTo) rows = rows.filter((c) => (c.date ?? "") <= opts.dateTo!);
  if (opts.search) {
    const s = opts.search.trim().toLowerCase();
    rows = rows.filter((c) =>
      [c.caseNo, c.company, c.assignee, c.customerStatus, c.initialDetail, c.latestFollowUp].some((v) =>
        v.toLowerCase().includes(s),
      ),
    );
  }

  if (opts.sortBy) {
    const key = opts.sortBy;
    const dir = opts.sortOrder === "desc" ? -1 : 1;
    rows = [...rows].sort((a, b) => String(a[key] ?? "").localeCompare(String(b[key] ?? ""), "th") * dir);
  }

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / opts.pageSize));
  const page = Math.min(Math.max(1, opts.page), totalPages);
  const data = rows.slice((page - 1) * opts.pageSize, page * opts.pageSize);
  return { data, pagination: { page, pageSize: opts.pageSize, total, totalPages } };
}

/** Executive insights แบบ rule-based (คำนวณจากตัวเลขจริงเท่านั้น) */
export function computeInsights(
  summary: CustomerDashboardSummary,
  trends: CustomerTrendPoint[],
): CustomerInsight[] {
  const insights: CustomerInsight[] = [];
  if (summary.totalCustomers === 0) {
    insights.push({ type: "info", title: "ยังไม่มีข้อมูล", desc: "ยังไม่มีข้อมูลเพียงพอสำหรับการวิเคราะห์" });
    return insights;
  }

  if (summary.issueRate > 30) {
    insights.push({
      type: "danger",
      title: "สัดส่วนเคสที่มีปัญหาสูง",
      desc: `เคสที่มีปัญหาคิดเป็น ${summary.issueRate}% ควรตรวจสอบสาเหตุหลักและวางแผนติดตาม`,
    });
  }
  if (summary.unclassified > 0) {
    insights.push({
      type: "warn",
      title: "มีเคสที่ยังไม่ระบุสถานะ",
      desc: `พบ ${summary.unclassified} รายการที่ยังไม่ระบุสถานะ กรุณาตรวจสอบข้อมูลใน Google Sheets`,
    });
  }
  if (trends.length >= 2) {
    const prev = trends[trends.length - 2];
    const last = trends[trends.length - 1];
    if (last.completed > prev.completed) {
      insights.push({
        type: "success",
        title: "เคสปิดสำเร็จเพิ่มขึ้น",
        desc: `เดือน ${last.period} ปิดสำเร็จ ${last.completed} เคส เพิ่มขึ้นจาก ${prev.completed} เคสในเดือนก่อนหน้า`,
      });
    }
  }
  if (summary.completionRate >= 50) {
    insights.push({
      type: "success",
      title: "อัตราปิดเคสอยู่ในเกณฑ์ดี",
      desc: `อัตราปิดเคสสำเร็จ ${summary.completionRate}%`,
    });
  }

  if (insights.length === 0) {
    insights.push({ type: "info", title: "ภาพรวมคงที่", desc: "ยังไม่มีสัญญาณที่ต้องดำเนินการเร่งด่วน" });
  }
  return insights;
}
