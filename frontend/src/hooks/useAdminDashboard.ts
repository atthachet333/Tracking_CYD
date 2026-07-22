import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminDashboardApi } from "@/services/admin-dashboard-api";
import { queryKeys } from "@/lib/query-keys";

export const useAdminSummary = () =>
  useQuery({ queryKey: queryKeys.adminDashboard.summary, queryFn: () => adminDashboardApi.summary(), retry: 1 });
export const useAdminDistribution = () =>
  useQuery({ queryKey: queryKeys.adminDashboard.distribution, queryFn: () => adminDashboardApi.statusDistribution(), retry: 1 });
export const useAdminAssignees = () =>
  useQuery({ queryKey: queryKeys.adminDashboard.assignees, queryFn: () => adminDashboardApi.assignees(), retry: 1 });
export const useAdminCompanies = () =>
  useQuery({ queryKey: queryKeys.adminDashboard.companies, queryFn: () => adminDashboardApi.companies(), retry: 1 });
export const useAdminRecent = () =>
  useQuery({ queryKey: queryKeys.adminDashboard.recentItems, queryFn: () => adminDashboardApi.recentItems(), retry: 1 });
export const useAdminTrends = () =>
  useQuery({ queryKey: queryKeys.adminDashboard.trends, queryFn: () => adminDashboardApi.trends(), retry: 1 });

export function useRefreshAdminDashboard() {
  const qc = useQueryClient();
  return async () => {
    await adminDashboardApi.summary(true);
    await qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
  };
}
