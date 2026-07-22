import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardApi, type ListParams } from "@/services/dashboard-api";
import { sheetsApi, type SheetRowsParams } from "@/services/sheets-api";
import { queryKeys } from "@/lib/query-keys";

/* ---------- Dashboard ---------- */
export const useHealth = () => useQuery({ queryKey: queryKeys.health, queryFn: dashboardApi.health });
export const useDashboardSummary = () => useQuery({ queryKey: queryKeys.dashboard.summary, queryFn: dashboardApi.summary });
export const useDashboardTrends = () => useQuery({ queryKey: queryKeys.dashboard.trends, queryFn: dashboardApi.trends });
export const useDashboardInsights = () => useQuery({ queryKey: queryKeys.dashboard.insights, queryFn: dashboardApi.insights });

/* ---------- Entities ---------- */
export const useEmployees = (params?: ListParams) =>
  useQuery({ queryKey: queryKeys.employees(params), queryFn: () => dashboardApi.employees(params) });
export const useOrgChart = () => useQuery({ queryKey: queryKeys.orgChart, queryFn: dashboardApi.orgChart });
export const useTasks = (params?: ListParams) =>
  useQuery({ queryKey: queryKeys.tasks(params), queryFn: () => dashboardApi.tasks(params) });
export const useDocuments = (params?: ListParams) =>
  useQuery({ queryKey: queryKeys.documents(params), queryFn: () => dashboardApi.documents(params) });
export const useApprovals = () => useQuery({ queryKey: queryKeys.approvals, queryFn: dashboardApi.approvals });
export const useCustomers = (params?: ListParams) =>
  useQuery({ queryKey: queryKeys.customers(params), queryFn: () => dashboardApi.customers(params) });
export const useReports = () => useQuery({ queryKey: queryKeys.reports, queryFn: dashboardApi.reports });
export const useNotifications = () => useQuery({ queryKey: queryKeys.notifications, queryFn: dashboardApi.notifications });

/* ---------- Google Sheets ---------- */
export const useSheetStatus = () =>
  useQuery({ queryKey: queryKeys.sheets.status, queryFn: sheetsApi.status, retry: 0 });
export const useSheetMetadata = (enabled = true) =>
  useQuery({ queryKey: queryKeys.sheets.metadata, queryFn: sheetsApi.metadata, enabled, retry: 0 });
export const useSheetHeaders = (enabled = true) =>
  useQuery({ queryKey: queryKeys.sheets.headers, queryFn: sheetsApi.headers, enabled, retry: 0 });
export const useSheetRows = (params?: SheetRowsParams) =>
  useQuery({ queryKey: queryKeys.sheets.rows(params), queryFn: () => sheetsApi.rows(params), retry: 0 });
export const useSheetSummary = (enabled = true) =>
  useQuery({ queryKey: queryKeys.sheets.summary, queryFn: sheetsApi.summary, enabled, retry: 0 });

/** คำนวณ + เขียนสรุปลง SUMMARY tab ของ Sheet 1 แล้ว invalidate summary query */
export const useRebuildSummary = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: sheetsApi.rebuildSummary,
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.sheets.summary, data);
    },
  });
};

/** รีเฟรช: ล้าง cache ที่ backend แล้ว invalidate ทุก query ที่ frontend */
export const useRefreshSheet = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: sheetsApi.refresh,
    onSuccess: () => {
      void qc.invalidateQueries();
    },
  });
};

/** sync แท็บ "พี่คิม" → ADMIN แล้ว invalidate queries */
export const useSyncAdminPKim = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: sheetsApi.syncAdminPKim,
    onSuccess: () => {
      void qc.invalidateQueries();
    },
  });
};

export const useSyncAdmin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: sheetsApi.syncAdmin,
    onSuccess: () => {
      void qc.invalidateQueries();
    },
  });
};

export const useSyncAdminAll = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: sheetsApi.syncAdminAll,
    onSuccess: () => {
      void qc.invalidateQueries();
    },
  });
};
