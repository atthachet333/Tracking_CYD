/* ============================================================
   Documents Dashboard Calculations (pure)
   ============================================================ */
import type {
  DocumentTaskItem, DocumentsSummary, DocumentsAssigneeStat, DocumentsCompanyStat,
  CustomerStatusDistributionItem, CustomerActualStatusItem, CustomerStatusGroup,
  CustomerTrendPoint, CustomerInsight, Pagination, PaymentDistributionItem, PaymentGroup,
} from "@tracking-cyd/shared";
import { GROUP_LABELS, GROUP_ORDER, PAYMENT_LABELS } from "./documents-status.config";
import { workloadLevel } from "./documents-dashboard.types";

const PAYMENT_ORDER: PaymentGroup[] = ["paid", "pending", "partial", "problem", "unclassified"];

function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 10000) / 100;
}

function normCompany(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

/** แปลงวันที่ → "YYYY-MM" (รองรับ yyyy-mm-dd และ dd/mm/yyyy รวมปี พ.ศ.) */
export function toPeriod(date: string | null): string | null {
  if (!date) return null;
  const iso = /^(\d{4})-(\d{2})/.exec(date);
  if (iso) return `${iso[1]}-${iso[2]}`;
  const dmy = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/.exec(date.trim());
  if (dmy) {
    let year = Number(dmy[3]);
    if (year > 2500) year -= 543; // พ.ศ. → ค.ศ.
    return `${year}-${dmy[2].padStart(2, "0")}`;
  }
  return null;
}

export function computeSummary(items: DocumentTaskItem[]): DocumentsSummary {
  const total = items.length;
  const companies = new Set<string>();
  const employees = new Set<string>();
  let inProgress = 0, completed = 0, issues = 0, unclassified = 0;
  for (const it of items) {
    if (it.company.trim()) companies.add(normCompany(it.company));
    if (it.assignee.trim()) employees.add(it.assignee.trim());
    if (it.statusGroup === "in_progress") inProgress++;
    else if (it.statusGroup === "completed") completed++;
    else if (it.statusGroup === "issues") issues++;
    else unclassified++;
  }
  const pendingPayment = items.filter((i) => i.paymentGroup === "pending").length;
  const paidPayment = items.filter((i) => i.paymentGroup === "paid").length;

  return {
    totalItems: total,
    inProgress, completed, issues, unclassified,
    uniqueCompanies: companies.size,
    totalEmployees: employees.size,
    completionRate: pct(completed, total),
    issueRate: pct(issues, total),
    pendingPayment,
    paidPayment,
  };
}

/** สัดส่วนสถานะการชำระ (paid/pending/unpaid) */
export function computePaymentDistribution(items: DocumentTaskItem[]): PaymentDistributionItem[] {
  const total = items.length;
  const counts = new Map<PaymentGroup, number>();
  for (const it of items) counts.set(it.paymentGroup, (counts.get(it.paymentGroup) ?? 0) + 1);
  return PAYMENT_ORDER.map((key) => {
    const count = counts.get(key) ?? 0;
    return { key, label: PAYMENT_LABELS[key], count, percentage: pct(count, total) };
  });
}

/** ค่าดิบสถานะการชำระ (เรียงมากไปน้อย) */
export function computePaymentActual(items: DocumentTaskItem[]): CustomerActualStatusItem[] {
  const counts = new Map<string, { count: number; group: CustomerStatusGroup }>();
  for (const it of items) {
    const label = it.paymentStatus.trim() || "(ไม่ระบุ)";
    const cur = counts.get(label);
    if (cur) cur.count++;
    else counts.set(label, { count: 1, group: "unclassified" });
  }
  return [...counts.entries()].map(([status, v]) => ({ status, count: v.count, group: v.group })).sort((a, b) => b.count - a.count);
}

export function computeDistribution(items: DocumentTaskItem[]): CustomerStatusDistributionItem[] {
  const total = items.length;
  const counts = new Map<CustomerStatusGroup, number>();
  for (const it of items) counts.set(it.statusGroup, (counts.get(it.statusGroup) ?? 0) + 1);
  return GROUP_ORDER.map((key) => {
    const count = counts.get(key) ?? 0;
    return { key, label: GROUP_LABELS[key], count, percentage: pct(count, total) };
  });
}

export function computeActualBreakdown(items: DocumentTaskItem[]): CustomerActualStatusItem[] {
  const counts = new Map<string, { count: number; group: CustomerStatusGroup }>();
  for (const it of items) {
    const label = it.actualStatus.trim() || "(ไม่ระบุ)";
    const cur = counts.get(label);
    if (cur) cur.count++;
    else counts.set(label, { count: 1, group: it.statusGroup });
  }
  return [...counts.entries()]
    .map(([status, v]) => ({ status, count: v.count, group: v.group }))
    .sort((a, b) => b.count - a.count || a.status.localeCompare(b.status));
}

export function computeAssignees(items: DocumentTaskItem[]): DocumentsAssigneeStat[] {
  const map = new Map<string, { total: number; ip: number; done: number; iss: number; unc: number; pend: number; companies: Set<string>; latest: string | null }>();
  for (const it of items) {
    const a = it.assignee.trim() || "ไม่ระบุ";
    const s = map.get(a) ?? { total: 0, ip: 0, done: 0, iss: 0, unc: 0, pend: 0, companies: new Set<string>(), latest: null };
    s.total++;
    if (it.statusGroup === "in_progress") s.ip++;
    else if (it.statusGroup === "completed") s.done++;
    else if (it.statusGroup === "issues") s.iss++;
    else s.unc++;
    if (it.paymentGroup === "pending") s.pend++;
    if (it.company.trim()) s.companies.add(normCompany(it.company));
    if (it.workDate && (!s.latest || it.workDate > s.latest)) s.latest = it.workDate;
    map.set(a, s);
  }
  return [...map.entries()]
    .map(([assignee, s]) => ({
      assignee, total: s.total, inProgress: s.ip, completed: s.done, issues: s.iss, unclassified: s.unc,
      pendingPayment: s.pend, companies: s.companies.size, latestDate: s.latest, workloadLevel: workloadLevel(s.total),
    }))
    .sort((a, b) => b.total - a.total || a.assignee.localeCompare(b.assignee));
}

export function computeCompanies(items: DocumentTaskItem[]): DocumentsCompanyStat[] {
  const map = new Map<string, { display: string; total: number; assignees: Set<string>; latest: DocumentTaskItem | null }>();
  for (const it of items) {
    const key = normCompany(it.company) || "(ไม่ระบุ)";
    const s = map.get(key) ?? { display: it.company.trim() || "(ไม่ระบุ)", total: 0, assignees: new Set<string>(), latest: null };
    s.total++;
    if (it.assignee.trim()) s.assignees.add(it.assignee.trim());
    if (!s.latest || (it.workDate ?? "") > (s.latest.workDate ?? "")) s.latest = it;
    map.set(key, s);
  }
  return [...map.values()]
    .map((s) => ({
      company: s.display, total: s.total, assignees: [...s.assignees],
      latestStatus: s.latest?.actualStatus ?? "", latestPayment: s.latest?.paymentStatus ?? "",
      latestDetail: s.latest?.detail ?? "", latestDate: s.latest?.workDate ?? null,
    }))
    .sort((a, b) => b.total - a.total || a.company.localeCompare(b.company));
}

export function computeRecent(items: DocumentTaskItem[], limit = 15): DocumentTaskItem[] {
  return [...items].sort((a, b) => {
    const da = a.workDate ?? "", db = b.workDate ?? "";
    if (da && db) return db.localeCompare(da);
    if (da) return -1;
    if (db) return 1;
    return b.sourceRow - a.sourceRow;
  }).slice(0, limit);
}

export function computeTrends(items: DocumentTaskItem[]): CustomerTrendPoint[] {
  const byPeriod = new Map<string, CustomerTrendPoint>();
  for (const it of items) {
    const period = toPeriod(it.workDate);
    if (!period) continue;
    const p = byPeriod.get(period) ?? { period, total: 0, completed: 0, issues: 0 };
    p.total++;
    if (it.statusGroup === "completed") p.completed++;
    if (it.statusGroup === "issues") p.issues++;
    byPeriod.set(period, p);
  }
  return [...byPeriod.values()].sort((a, b) => a.period.localeCompare(b.period));
}

export interface DocFilterOpts {
  search?: string; status?: string; statusGroup?: CustomerStatusGroup;
  paymentStatus?: string; paymentGroup?: PaymentGroup;
  assignee?: string; company?: string;
  dateFrom?: string; dateTo?: string;
  sortBy?: "workDate" | "caseNo" | "company" | "assignee" | "actualStatus" | "paymentStatus";
  sortOrder?: "asc" | "desc"; page: number; pageSize: number;
}

export function filterItems(items: DocumentTaskItem[], o: DocFilterOpts): { data: DocumentTaskItem[]; pagination: Pagination } {
  let rows = items;
  if (o.statusGroup) rows = rows.filter((r) => r.statusGroup === o.statusGroup);
  if (o.paymentGroup) rows = rows.filter((r) => r.paymentGroup === o.paymentGroup);
  if (o.assignee) { const a = o.assignee.toLowerCase(); rows = rows.filter((r) => r.assignee.toLowerCase().includes(a)); }
  if (o.company) { const c = o.company.toLowerCase(); rows = rows.filter((r) => r.company.toLowerCase().includes(c)); }
  if (o.status) { const s = o.status.toLowerCase(); rows = rows.filter((r) => r.actualStatus.toLowerCase().includes(s)); }
  if (o.paymentStatus) { const p = o.paymentStatus.toLowerCase(); rows = rows.filter((r) => r.paymentStatus.toLowerCase().includes(p)); }
  if (o.dateFrom) rows = rows.filter((r) => (r.workDate ?? "") >= o.dateFrom!);
  if (o.dateTo) rows = rows.filter((r) => (r.workDate ?? "") <= o.dateTo!);
  if (o.search) {
    const s = o.search.toLowerCase();
    rows = rows.filter((r) => [r.caseNo, r.company, r.assignee, r.actualStatus, r.paymentStatus, r.detail].some((v) => v.toLowerCase().includes(s)));
  }
  if (o.sortBy) {
    const key = o.sortBy, dir = o.sortOrder === "desc" ? -1 : 1;
    rows = [...rows].sort((a, b) => String(a[key] ?? "").localeCompare(String(b[key] ?? ""), "th") * dir);
  }
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / o.pageSize));
  const page = Math.min(Math.max(1, o.page), totalPages);
  return { data: rows.slice((page - 1) * o.pageSize, page * o.pageSize), pagination: { page, pageSize: o.pageSize, total, totalPages } };
}

export function computeInsights(summary: DocumentsSummary, assignees: DocumentsAssigneeStat[]): CustomerInsight[] {
  const out: CustomerInsight[] = [];
  if (summary.totalItems === 0) {
    out.push({ type: "info", title: "ยังไม่มีข้อมูล", desc: "ยังไม่มีข้อมูลเพียงพอสำหรับการวิเคราะห์" });
    return out;
  }
  if (summary.issueRate > 30) out.push({ type: "danger", title: "งานมีปัญหาสูง", desc: `งานที่ต้องติดตามคิดเป็น ${summary.issueRate}% ควรเร่งตรวจสอบ` });
  if (summary.unclassified > 0) out.push({ type: "warn", title: "มีงานยังไม่ระบุสถานะ", desc: `พบ ${summary.unclassified} รายการที่ยังไม่ระบุสถานะ` });
  const top = assignees[0];
  if (top && (top.workloadLevel === "high" || top.workloadLevel === "critical")) {
    out.push({ type: "warn", title: "ภาระงานสูง", desc: `${top.assignee} รับผิดชอบ ${top.total} งาน (ระดับ ${top.workloadLevel})` });
  }
  if (summary.completionRate >= 50) out.push({ type: "success", title: "อัตรางานเสร็จดี", desc: `งานเสร็จสิ้น ${summary.completionRate}%` });
  if (out.length === 0) out.push({ type: "info", title: "ภาพรวมคงที่", desc: "ยังไม่มีสัญญาณที่ต้องดำเนินการเร่งด่วน" });
  return out;
}
