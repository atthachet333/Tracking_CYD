/* ============================================================
   Customer Dashboard Controller — เรียก service + calculations เท่านั้น
   (ไม่แตะ googleapis ตรง ๆ)
   ============================================================ */
import type { FastifyRequest } from "fastify";
import type {
  CustomerSummaryResponse,
  CustomerStatusDistributionResponse,
  CustomerActualStatusesResponse,
  CustomerRecentCasesResponse,
  CustomerCasesResponse,
  CustomerProblemCasesResponse,
  CustomerListResponse,
  CustomerTrendsResponse,
} from "@tracking-cyd/shared";
import { refreshQuerySchema, problemCasesQuerySchema, customersQuerySchema } from "../../schemas/index";
import { customerDashboardService } from "./customer-dashboard.service";
import {
  computeSummary,
  computeDistribution,
  computeActualBreakdown,
  computeRecentCases,
  computeTrends,
  computeInsights,
  filterProblemCases,
  filterCustomers,
  casesInGroup,
} from "./customer-dashboard.calculations";

export const customerDashboardController = {
  async summary(req: FastifyRequest): Promise<CustomerSummaryResponse> {
    const { refresh } = refreshQuerySchema.parse(req.query);
    const { dataset, cacheHit } = await customerDashboardService.getDataset(refresh);
    const data = computeSummary(dataset.cases);
    const trends = computeTrends(dataset.cases);
    return { data, insights: computeInsights(data, trends), meta: customerDashboardService.buildMeta(dataset, cacheHit) };
  },

  async statusDistribution(req: FastifyRequest): Promise<CustomerStatusDistributionResponse> {
    const { refresh } = refreshQuerySchema.parse(req.query);
    const { dataset, cacheHit } = await customerDashboardService.getDataset(refresh);
    return {
      data: computeDistribution(dataset.cases),
      actual: computeActualBreakdown(dataset.cases),
      meta: customerDashboardService.buildMeta(dataset, cacheHit),
    };
  },

  async actualStatuses(req: FastifyRequest): Promise<CustomerActualStatusesResponse> {
    const { refresh } = refreshQuerySchema.parse(req.query);
    const { dataset, cacheHit } = await customerDashboardService.getDataset(refresh);
    return { data: computeActualBreakdown(dataset.cases), meta: customerDashboardService.buildMeta(dataset, cacheHit) };
  },

  async recentCases(req: FastifyRequest): Promise<CustomerRecentCasesResponse> {
    const { refresh } = refreshQuerySchema.parse(req.query);
    const { dataset, cacheHit } = await customerDashboardService.getDataset(refresh);
    return { data: computeRecentCases(dataset.cases), meta: customerDashboardService.buildMeta(dataset, cacheHit) };
  },

  async inProgressCases(req: FastifyRequest): Promise<CustomerCasesResponse> {
    const { refresh } = refreshQuerySchema.parse(req.query);
    const { dataset, cacheHit } = await customerDashboardService.getDataset(refresh);
    return { data: casesInGroup(dataset.cases, "in_progress"), meta: customerDashboardService.buildMeta(dataset, cacheHit) };
  },

  async completedCases(req: FastifyRequest): Promise<CustomerCasesResponse> {
    const { refresh } = refreshQuerySchema.parse(req.query);
    const { dataset, cacheHit } = await customerDashboardService.getDataset(refresh);
    return { data: casesInGroup(dataset.cases, "completed"), meta: customerDashboardService.buildMeta(dataset, cacheHit) };
  },

  async customers(req: FastifyRequest): Promise<CustomerListResponse> {
    const q = customersQuerySchema.parse(req.query);
    const { dataset, cacheHit } = await customerDashboardService.getDataset(q.refresh);
    const { data, pagination } = filterCustomers(dataset.cases, {
      search: q.search,
      status: q.status,
      statusGroup: q.statusGroup,
      assignee: q.assignee,
      dateFrom: q.dateFrom,
      dateTo: q.dateTo,
      sortBy: q.sortBy,
      sortOrder: q.sortOrder,
      page: q.page,
      pageSize: q.pageSize,
    });
    return { data, pagination, meta: customerDashboardService.buildMeta(dataset, cacheHit) };
  },

  async trends(req: FastifyRequest): Promise<CustomerTrendsResponse> {
    const { refresh } = refreshQuerySchema.parse(req.query);
    const { dataset, cacheHit } = await customerDashboardService.getDataset(refresh);
    return { data: computeTrends(dataset.cases), meta: customerDashboardService.buildMeta(dataset, cacheHit) };
  },

  async problemCases(req: FastifyRequest): Promise<CustomerProblemCasesResponse> {
    const q = problemCasesQuerySchema.parse(req.query);
    const { dataset, cacheHit } = await customerDashboardService.getDataset(q.refresh);
    const { data, pagination } = filterProblemCases(dataset.cases, {
      search: q.search,
      status: q.status,
      page: q.page,
      pageSize: q.pageSize,
    });
    return { data, pagination, meta: customerDashboardService.buildMeta(dataset, cacheHit) };
  },
};
