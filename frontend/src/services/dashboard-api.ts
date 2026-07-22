/* ============================================================
   Dashboard + Entity API
   ============================================================ */
import { httpGet, toQuery } from "./api-client";
import type {
  DashboardSummary, TrendPoint, Insight, Employee, OrgNode, Task,
  DocumentItem, Customer, NotificationItem, ReportData, Paginated, HealthResponse,
} from "@/types";

export interface ListParams {
  q?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

const list = (p?: ListParams) => toQuery({ q: p?.q, status: p?.status, page: p?.page, pageSize: p?.pageSize });

export const dashboardApi = {
  health: () => httpGet<HealthResponse>("/health"),
  summary: () => httpGet<DashboardSummary>("/dashboard/summary"),
  trends: () => httpGet<TrendPoint[]>("/dashboard/trends"),
  insights: () => httpGet<Insight[]>("/dashboard/insights"),

  employees: (p?: ListParams) => httpGet<Paginated<Employee>>(`/employees${list(p)}`),
  employee: (id: number) => httpGet<Employee>(`/employees/${id}`),
  orgChart: () => httpGet<OrgNode[]>("/employees/org-chart"),
  tasks: (p?: ListParams) => httpGet<Paginated<Task>>(`/tasks${list(p)}`),
  documents: (p?: ListParams) => httpGet<Paginated<DocumentItem>>(`/documents${list(p)}`),
  approvals: () => httpGet<DocumentItem[]>("/approvals"),
  customers: (p?: ListParams) => httpGet<Paginated<Customer>>(`/customers${list(p)}`),
  reports: () => httpGet<ReportData>("/reports"),
  notifications: () => httpGet<NotificationItem[]>("/notifications"),
};
