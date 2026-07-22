// Re-export customer-dashboard contracts จาก shared (ให้ import ภายใน frontend สั้นลง)
export type {
  CustomerStatusGroup,
  CustomerDashboardMeta,
  CustomerDashboardSummary,
  CustomerStatusDistributionItem,
  CustomerActualStatusItem,
  CustomerCaseItem,
  CustomerTrendPoint,
  CustomerInsight,
  CustomerSummaryResponse,
  CustomerStatusDistributionResponse,
  CustomerActualStatusesResponse,
  CustomerRecentCasesResponse,
  CustomerCasesResponse,
  CustomerProblemCasesResponse,
  CustomerListResponse,
  CustomerTrendsResponse,
} from "@tracking-cyd/shared";
