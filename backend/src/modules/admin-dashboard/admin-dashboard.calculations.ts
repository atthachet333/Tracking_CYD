/* ============================================================
   Admin Dashboard Calculations (pure) — assignees + companies จาก CustomerCaseItem
   (summary/distribution/actual/recent/trends/insights ใช้ซ้ำจาก customer-dashboard)
   ============================================================ */
import type { CustomerCaseItem, DocumentsAssigneeStat, DocumentsCompanyStat } from "@tracking-cyd/shared";
import { workloadLevel } from "../documents-dashboard/documents-dashboard.types";

function normCompany(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

export function computeCaseAssignees(cases: CustomerCaseItem[]): DocumentsAssigneeStat[] {
  const map = new Map<string, { total: number; ip: number; done: number; iss: number; unc: number; companies: Set<string>; latest: string | null }>();
  for (const c of cases) {
    const a = c.assignee.trim() || "ไม่ระบุ";
    const s = map.get(a) ?? { total: 0, ip: 0, done: 0, iss: 0, unc: 0, companies: new Set<string>(), latest: null };
    s.total++;
    if (c.statusGroup === "in_progress") s.ip++;
    else if (c.statusGroup === "completed") s.done++;
    else if (c.statusGroup === "issues") s.iss++;
    else s.unc++;
    if (c.company.trim()) s.companies.add(normCompany(c.company));
    if (c.date && (!s.latest || c.date > s.latest)) s.latest = c.date;
    map.set(a, s);
  }
  return [...map.entries()]
    .map(([assignee, s]) => ({
      assignee, total: s.total, inProgress: s.ip, completed: s.done, issues: s.iss, unclassified: s.unc,
      pendingPayment: 0, companies: s.companies.size, latestDate: s.latest, workloadLevel: workloadLevel(s.total),
    }))
    .sort((a, b) => b.total - a.total || a.assignee.localeCompare(b.assignee));
}

export function computeCaseCompanies(cases: CustomerCaseItem[]): DocumentsCompanyStat[] {
  const map = new Map<string, { display: string; total: number; assignees: Set<string>; latest: CustomerCaseItem | null }>();
  for (const c of cases) {
    const key = normCompany(c.company) || "(ไม่ระบุ)";
    const s = map.get(key) ?? { display: c.company.trim() || "(ไม่ระบุ)", total: 0, assignees: new Set<string>(), latest: null };
    s.total++;
    if (c.assignee.trim()) s.assignees.add(c.assignee.trim());
    if (!s.latest || (c.date ?? "") > (s.latest.date ?? "")) s.latest = c;
    map.set(key, s);
  }
  return [...map.values()]
    .map((s) => ({
      company: s.display, total: s.total, assignees: [...s.assignees],
      latestStatus: s.latest?.customerStatus ?? "", latestPayment: s.latest?.deposit ?? "",
      latestDetail: s.latest?.initialDetail ?? "", latestDate: s.latest?.date ?? null,
    }))
    .sort((a, b) => b.total - a.total || a.company.localeCompare(b.company));
}
