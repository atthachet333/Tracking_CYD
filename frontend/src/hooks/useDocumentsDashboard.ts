import { useQuery, useQueryClient } from "@tanstack/react-query";
import { documentsDashboardApi, type DocumentsItemsParams } from "@/services/documents-dashboard-api";
import { queryKeys } from "@/lib/query-keys";

export const useDocumentsSummary = () =>
  useQuery({ queryKey: queryKeys.documentsDashboard.summary, queryFn: () => documentsDashboardApi.summary(), retry: 1 });
export const useDocumentsDistribution = () =>
  useQuery({ queryKey: queryKeys.documentsDashboard.distribution, queryFn: () => documentsDashboardApi.statusDistribution(), retry: 1 });
export const useDocumentsPayment = () =>
  useQuery({ queryKey: queryKeys.documentsDashboard.payment, queryFn: () => documentsDashboardApi.paymentDistribution(), retry: 1 });
export const useDocumentsAssignees = () =>
  useQuery({ queryKey: queryKeys.documentsDashboard.assignees, queryFn: () => documentsDashboardApi.assignees(), retry: 1 });
export const useDocumentsCompanies = () =>
  useQuery({ queryKey: queryKeys.documentsDashboard.companies, queryFn: () => documentsDashboardApi.companies(), retry: 1 });
export const useDocumentsRecent = () =>
  useQuery({ queryKey: queryKeys.documentsDashboard.recentItems, queryFn: () => documentsDashboardApi.recentItems(), retry: 1 });
export const useDocumentsTrends = () =>
  useQuery({ queryKey: queryKeys.documentsDashboard.trends, queryFn: () => documentsDashboardApi.trends(), retry: 1 });
export const useDocumentsHeaders = (enabled = true) =>
  useQuery({ queryKey: queryKeys.documentsDashboard.headers, queryFn: () => documentsDashboardApi.headers(), enabled, retry: 1 });
export const useDocumentsItems = (params: DocumentsItemsParams) =>
  useQuery({
    queryKey: queryKeys.documentsDashboard.items(params),
    queryFn: () => documentsDashboardApi.items(params),
    retry: 1,
    placeholderData: (prev) => prev,
  });

/** refresh backend cache แล้ว invalidate ทุก query ของ documents dashboard */
export function useRefreshDocumentsDashboard() {
  const qc = useQueryClient();
  return async () => {
    await documentsDashboardApi.summary(true);
    await qc.invalidateQueries({ queryKey: ["documents-dashboard"] });
  };
}
