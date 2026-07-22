/* ============================================================
   Admin Dashboard API — /api/admin-dashboard/* (แท็บ ADMIN)
   ============================================================ */
import { httpGet } from "./api-client";
import type {
  CustomerSummaryResponse, CustomerStatusDistributionResponse, CustomerRecentCasesResponse, CustomerTrendsResponse,
} from "@/types/customer-dashboard";
import type { AdminAssigneesResponse, AdminCompaniesResponse } from "@/types/documents-dashboard";

const rq = (r?: boolean) => (r ? "?refresh=true" : "");

export const adminDashboardApi = {
  summary: (r?: boolean) => httpGet<CustomerSummaryResponse>(`/admin-dashboard/summary${rq(r)}`),
  statusDistribution: (r?: boolean) => httpGet<CustomerStatusDistributionResponse>(`/admin-dashboard/status-distribution${rq(r)}`),
  assignees: (r?: boolean) => httpGet<AdminAssigneesResponse>(`/admin-dashboard/assignees${rq(r)}`),
  companies: (r?: boolean) => httpGet<AdminCompaniesResponse>(`/admin-dashboard/companies${rq(r)}`),
  recentItems: (r?: boolean) => httpGet<CustomerRecentCasesResponse>(`/admin-dashboard/recent-items${rq(r)}`),
  problemItems: (r?: boolean) => httpGet<CustomerRecentCasesResponse>(`/admin-dashboard/problem-items${rq(r)}`),
  inProgressItems: (r?: boolean) => httpGet<CustomerRecentCasesResponse>(`/admin-dashboard/in-progress-items${rq(r)}`),
  trends: (r?: boolean) => httpGet<CustomerTrendsResponse>(`/admin-dashboard/trends${rq(r)}`),
};
