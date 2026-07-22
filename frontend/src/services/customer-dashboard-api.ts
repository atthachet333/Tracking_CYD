/* ============================================================
   Customer Dashboard API — endpoint /api/customer-dashboard/*
   ============================================================ */
import { httpGet, toQuery } from "./api-client";
import type {
  CustomerSummaryResponse,
  CustomerStatusDistributionResponse,
  CustomerActualStatusesResponse,
  CustomerRecentCasesResponse,
  CustomerCasesResponse,
  CustomerProblemCasesResponse,
  CustomerListResponse,
  CustomerTrendsResponse,
} from "@/types/customer-dashboard";

export interface ProblemCasesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}

export interface CustomersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  statusGroup?: "in_progress" | "completed" | "issues" | "unclassified";
  assignee?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "date" | "caseNo" | "company" | "assignee" | "customerStatus";
  sortOrder?: "asc" | "desc";
}

const refreshQuery = (refresh?: boolean) => (refresh ? "?refresh=true" : "");

export const customerDashboardApi = {
  summary: (refresh?: boolean) => httpGet<CustomerSummaryResponse>(`/customer-dashboard/summary${refreshQuery(refresh)}`),
  statusDistribution: (refresh?: boolean) =>
    httpGet<CustomerStatusDistributionResponse>(`/customer-dashboard/status-distribution${refreshQuery(refresh)}`),
  actualStatuses: (refresh?: boolean) =>
    httpGet<CustomerActualStatusesResponse>(`/customer-dashboard/actual-statuses${refreshQuery(refresh)}`),
  recentCases: (refresh?: boolean) =>
    httpGet<CustomerRecentCasesResponse>(`/customer-dashboard/recent-cases${refreshQuery(refresh)}`),
  inProgressCases: (refresh?: boolean) =>
    httpGet<CustomerCasesResponse>(`/customer-dashboard/in-progress-cases${refreshQuery(refresh)}`),
  completedCases: (refresh?: boolean) =>
    httpGet<CustomerCasesResponse>(`/customer-dashboard/completed-cases${refreshQuery(refresh)}`),
  trends: (refresh?: boolean) => httpGet<CustomerTrendsResponse>(`/customer-dashboard/trends${refreshQuery(refresh)}`),
  problemCases: (p: ProblemCasesParams = {}) =>
    httpGet<CustomerProblemCasesResponse>(
      `/customer-dashboard/problem-cases${toQuery({ page: p.page, pageSize: p.pageSize, search: p.search, status: p.status })}`,
    ),
  customers: (p: CustomersParams = {}) =>
    httpGet<CustomerListResponse>(
      `/customer-dashboard/customers${toQuery({
        page: p.page, pageSize: p.pageSize, search: p.search, status: p.status, statusGroup: p.statusGroup,
        assignee: p.assignee, dateFrom: p.dateFrom, dateTo: p.dateTo, sortBy: p.sortBy, sortOrder: p.sortOrder,
      })}`,
    ),
};
