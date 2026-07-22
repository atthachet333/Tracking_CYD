/* ============================================================
   Documents Dashboard API — /api/documents-dashboard/*
   ============================================================ */
import { httpGet, toQuery } from "./api-client";
import type {
  DocumentsSummaryResponse, DocumentsStatusDistributionResponse, DocumentsAssigneesResponse,
  DocumentsCompaniesResponse, DocumentsItemsResponse, DocumentsRecentResponse, DocumentsTrendsResponse,
  DocumentsHeadersResponse,
} from "@/types/documents-dashboard";

export interface DocumentsItemsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  statusGroup?: "in_progress" | "completed" | "issues" | "unclassified";
  assignee?: string;
  company?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "workDate" | "caseNo" | "company" | "assignee" | "actualStatus";
  sortOrder?: "asc" | "desc";
}

const rq = (r?: boolean) => (r ? "?refresh=true" : "");

export const documentsDashboardApi = {
  summary: (r?: boolean) => httpGet<DocumentsSummaryResponse>(`/documents-dashboard/summary${rq(r)}`),
  statusDistribution: (r?: boolean) => httpGet<DocumentsStatusDistributionResponse>(`/documents-dashboard/status-distribution${rq(r)}`),
  assignees: (r?: boolean) => httpGet<DocumentsAssigneesResponse>(`/documents-dashboard/assignees${rq(r)}`),
  workload: (r?: boolean) => httpGet<DocumentsAssigneesResponse>(`/documents-dashboard/workload${rq(r)}`),
  companies: (r?: boolean) => httpGet<DocumentsCompaniesResponse>(`/documents-dashboard/companies${rq(r)}`),
  recentItems: (r?: boolean) => httpGet<DocumentsRecentResponse>(`/documents-dashboard/recent-items${rq(r)}`),
  problemItems: (r?: boolean) => httpGet<DocumentsRecentResponse>(`/documents-dashboard/problem-items${rq(r)}`),
  trends: (r?: boolean) => httpGet<DocumentsTrendsResponse>(`/documents-dashboard/trends${rq(r)}`),
  headers: (r?: boolean) => httpGet<DocumentsHeadersResponse>(`/documents-dashboard/headers${rq(r)}`),
  items: (p: DocumentsItemsParams = {}) =>
    httpGet<DocumentsItemsResponse>(
      `/documents-dashboard/items${toQuery({
        page: p.page, pageSize: p.pageSize, search: p.search, status: p.status, statusGroup: p.statusGroup,
        assignee: p.assignee, company: p.company, dateFrom: p.dateFrom, dateTo: p.dateTo, sortBy: p.sortBy, sortOrder: p.sortOrder,
      })}`,
    ),
};
