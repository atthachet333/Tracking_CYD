/* ============================================================
   Unified Tasks API — /api/tasks/unified (Admin + Documents)
   ============================================================ */
import { httpGet, toQuery } from "./api-client";
import type { UnifiedTasksResponse } from "@/types/documents-dashboard";

export interface UnifiedTasksParams {
  page?: number;
  pageSize?: number;
  department?: "admin" | "documents";
  search?: string;
  status?: string;
  statusGroup?: "in_progress" | "completed" | "issues" | "unclassified";
  assignee?: string;
  company?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "workDate" | "caseNo" | "companyName" | "assignee" | "actualStatus" | "department";
  sortOrder?: "asc" | "desc";
}

export const unifiedTasksApi = {
  list: (p: UnifiedTasksParams = {}) =>
    httpGet<UnifiedTasksResponse>(
      `/tasks/unified${toQuery({
        page: p.page, pageSize: p.pageSize, department: p.department, search: p.search, status: p.status,
        statusGroup: p.statusGroup, assignee: p.assignee, company: p.company, dateFrom: p.dateFrom, dateTo: p.dateTo,
        sortBy: p.sortBy, sortOrder: p.sortOrder,
      })}`,
    ),
};
