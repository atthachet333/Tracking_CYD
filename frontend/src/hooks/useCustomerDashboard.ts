import { useQuery, useQueryClient } from "@tanstack/react-query";
import { customerDashboardApi, type ProblemCasesParams, type CustomersParams } from "@/services/customer-dashboard-api";
import { queryKeys } from "@/lib/query-keys";

/* อ่านแยก endpoint แต่ backend cache รวม → เบา; retry 1 พอสำหรับ transient */
export const useCustomerSummary = () =>
  useQuery({ queryKey: queryKeys.customerDashboard.summary, queryFn: () => customerDashboardApi.summary(), retry: 1 });

export const useCustomerDistribution = () =>
  useQuery({ queryKey: queryKeys.customerDashboard.distribution, queryFn: () => customerDashboardApi.statusDistribution(), retry: 1 });

export const useCustomerRecentCases = () =>
  useQuery({ queryKey: queryKeys.customerDashboard.recentCases, queryFn: () => customerDashboardApi.recentCases(), retry: 1 });

export const useCustomerTrends = () =>
  useQuery({ queryKey: queryKeys.customerDashboard.trends, queryFn: () => customerDashboardApi.trends(), retry: 1 });

export const useCustomerActualStatuses = () =>
  useQuery({ queryKey: queryKeys.customerDashboard.actualStatuses, queryFn: () => customerDashboardApi.actualStatuses(), retry: 1 });

export const useCustomerInProgressCases = () =>
  useQuery({ queryKey: queryKeys.customerDashboard.inProgressCases, queryFn: () => customerDashboardApi.inProgressCases(), retry: 1 });

export const useCustomerCompletedCases = () =>
  useQuery({ queryKey: queryKeys.customerDashboard.completedCases, queryFn: () => customerDashboardApi.completedCases(), retry: 1 });

export const useCustomerProblemCases = (params: ProblemCasesParams) =>
  useQuery({
    queryKey: queryKeys.customerDashboard.problemCases(params),
    queryFn: () => customerDashboardApi.problemCases(params),
    retry: 1,
    placeholderData: (prev) => prev, // คงข้อมูลเดิมระหว่างเปลี่ยนหน้า/ค้นหา
  });

export const useCustomersList = (params: CustomersParams) =>
  useQuery({
    queryKey: queryKeys.customerDashboard.customers(params),
    queryFn: () => customerDashboardApi.customers(params),
    retry: 1,
    placeholderData: (prev) => prev,
  });

/** manual refresh: ยิง ?refresh=true (ล้าง cache backend) แล้ว invalidate ทุก query ของ dashboard นี้ */
export function useRefreshCustomerDashboard() {
  const qc = useQueryClient();
  return async () => {
    await customerDashboardApi.summary(true); // rebuild cache ฝั่ง backend หนึ่งครั้ง
    await qc.invalidateQueries({ queryKey: ["customer-dashboard"] });
  };
}
