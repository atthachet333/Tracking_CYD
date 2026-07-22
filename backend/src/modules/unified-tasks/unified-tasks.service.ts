/* ============================================================
   Unified Tasks Service — รวมงาน Admin + Documents แล้ว filter/sort/paginate
   - ดึงจาก service ของแต่ละโดเมน (cache ของแต่ละโดเมนทำงานอยู่แล้ว)
   - ทนต่อโดเมนใดโดเมนหนึ่งล่ม (ใส่ warning แต่ยังคืนอีกฝั่ง)
   ============================================================ */
import type { UnifiedTask, UnifiedTasksResponse, CustomerStatusGroup, Pagination } from "@tracking-cyd/shared";
import { customerDashboardService } from "../customer-dashboard/customer-dashboard.service";
import { documentsDashboardService } from "../documents-dashboard/documents-dashboard.service";
import { adminToUnified, documentToUnified } from "./unified-tasks.adapter";

export interface UnifiedFilterOpts {
  department?: "admin" | "documents";
  search?: string;
  status?: string;
  statusGroup?: CustomerStatusGroup;
  assignee?: string;
  company?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "workDate" | "caseNo" | "companyName" | "assignee" | "actualStatus" | "department";
  sortOrder?: "asc" | "desc";
  page: number;
  pageSize: number;
  refresh?: boolean;
}

async function collect(refresh: boolean): Promise<{ tasks: UnifiedTask[]; warnings: string[] }> {
  const warnings: string[] = [];
  let tasks: UnifiedTask[] = [];

  const [adminRes, docsRes] = await Promise.allSettled([
    customerDashboardService.getDataset(refresh),
    documentsDashboardService.getDataset(refresh),
  ]);

  if (adminRes.status === "fulfilled") tasks = tasks.concat(adminRes.value.dataset.cases.map(adminToUnified));
  else warnings.push(`อ่านงาน Admin ไม่สำเร็จ: ${(adminRes.reason as Error)?.message ?? "unknown"}`);

  if (docsRes.status === "fulfilled") tasks = tasks.concat(docsRes.value.dataset.items.map(documentToUnified));
  else warnings.push(`อ่านงาน Documents ไม่สำเร็จ: ${(docsRes.reason as Error)?.message ?? "unknown"}`);

  // ถ้าทั้งคู่ล่มให้โยน error ของ admin (config/permission) เพื่อคืน status code ที่เหมาะสม
  if (adminRes.status === "rejected" && docsRes.status === "rejected") {
    throw adminRes.reason;
  }
  return { tasks, warnings };
}

export const unifiedTasksService = {
  async getTasks(o: UnifiedFilterOpts): Promise<UnifiedTasksResponse> {
    const { tasks, warnings } = await collect(Boolean(o.refresh));

    let rows = tasks;
    if (o.department) rows = rows.filter((t) => t.department === o.department);
    if (o.statusGroup) rows = rows.filter((t) => t.statusGroup === o.statusGroup);
    if (o.assignee) { const a = o.assignee.toLowerCase(); rows = rows.filter((t) => t.assignee.toLowerCase().includes(a)); }
    if (o.company) { const c = o.company.toLowerCase(); rows = rows.filter((t) => t.companyName.toLowerCase().includes(c)); }
    if (o.status) { const s = o.status.toLowerCase(); rows = rows.filter((t) => t.actualStatus.toLowerCase().includes(s)); }
    if (o.dateFrom) rows = rows.filter((t) => (t.workDate ?? "") >= o.dateFrom!);
    if (o.dateTo) rows = rows.filter((t) => (t.workDate ?? "") <= o.dateTo!);
    if (o.search) {
      const s = o.search.toLowerCase();
      rows = rows.filter((t) => [t.caseNo, t.companyName, t.assignee, t.actualStatus, t.detail].some((v) => v.toLowerCase().includes(s)));
    }

    if (o.sortBy) {
      const key = o.sortBy, dir = o.sortOrder === "desc" ? -1 : 1;
      rows = [...rows].sort((a, b) => String(a[key] ?? "").localeCompare(String(b[key] ?? ""), "th") * dir);
    }

    const summary = {
      all: rows.length,
      admin: rows.filter((t) => t.department === "admin").length,
      documents: rows.filter((t) => t.department === "documents").length,
    };

    const total = rows.length;
    const totalPages = Math.max(1, Math.ceil(total / o.pageSize));
    const page = Math.min(Math.max(1, o.page), totalPages);
    const data = rows.slice((page - 1) * o.pageSize, page * o.pageSize);
    const pagination: Pagination = { page, pageSize: o.pageSize, total, totalPages };

    return { data, pagination, summary, meta: { warnings } };
  },
};
