/* ============================================================
   Admin Dashboard Controller — ADMIN tab (reuse customer calculations)
   ============================================================ */
import type { FastifyRequest } from "fastify";
import type {
  CustomerSummaryResponse, CustomerStatusDistributionResponse, CustomerRecentCasesResponse,
  CustomerTrendsResponse, AdminAssigneesResponse, AdminCompaniesResponse,
} from "@tracking-cyd/shared";
import { refreshQuerySchema } from "../../schemas/index";
import { adminDashboardService } from "./admin-dashboard.service";
import {
  computeSummary, computeDistribution, computeActualBreakdown, computeRecentCases, computeTrends, computeInsights, casesInGroup,
} from "../customer-dashboard/customer-dashboard.calculations";
import { computeCaseAssignees, computeCaseCompanies } from "./admin-dashboard.calculations";

export const adminDashboardController = {
  async summary(req: FastifyRequest): Promise<CustomerSummaryResponse> {
    const { refresh } = refreshQuerySchema.parse(req.query);
    const { dataset, cacheHit } = await adminDashboardService.getDataset(refresh);
    const data = computeSummary(dataset.cases);
    return { data, insights: computeInsights(data, computeTrends(dataset.cases)), meta: adminDashboardService.buildMeta(dataset, cacheHit) };
  },
  async statusDistribution(req: FastifyRequest): Promise<CustomerStatusDistributionResponse> {
    const { refresh } = refreshQuerySchema.parse(req.query);
    const { dataset, cacheHit } = await adminDashboardService.getDataset(refresh);
    return { data: computeDistribution(dataset.cases), actual: computeActualBreakdown(dataset.cases), meta: adminDashboardService.buildMeta(dataset, cacheHit) };
  },
  async assignees(req: FastifyRequest): Promise<AdminAssigneesResponse> {
    const { refresh } = refreshQuerySchema.parse(req.query);
    const { dataset, cacheHit } = await adminDashboardService.getDataset(refresh);
    return { data: computeCaseAssignees(dataset.cases), meta: adminDashboardService.buildMeta(dataset, cacheHit) };
  },
  async companies(req: FastifyRequest): Promise<AdminCompaniesResponse> {
    const { refresh } = refreshQuerySchema.parse(req.query);
    const { dataset, cacheHit } = await adminDashboardService.getDataset(refresh);
    return { data: computeCaseCompanies(dataset.cases), meta: adminDashboardService.buildMeta(dataset, cacheHit) };
  },
  async recentItems(req: FastifyRequest): Promise<CustomerRecentCasesResponse> {
    const { refresh } = refreshQuerySchema.parse(req.query);
    const { dataset, cacheHit } = await adminDashboardService.getDataset(refresh);
    return { data: computeRecentCases(dataset.cases, 20), meta: adminDashboardService.buildMeta(dataset, cacheHit) };
  },
  async problemItems(req: FastifyRequest): Promise<CustomerRecentCasesResponse> {
    const { refresh } = refreshQuerySchema.parse(req.query);
    const { dataset, cacheHit } = await adminDashboardService.getDataset(refresh);
    return { data: casesInGroup(dataset.cases, "issues"), meta: adminDashboardService.buildMeta(dataset, cacheHit) };
  },
  async inProgressItems(req: FastifyRequest): Promise<CustomerRecentCasesResponse> {
    const { refresh } = refreshQuerySchema.parse(req.query);
    const { dataset, cacheHit } = await adminDashboardService.getDataset(refresh);
    return { data: casesInGroup(dataset.cases, "in_progress"), meta: adminDashboardService.buildMeta(dataset, cacheHit) };
  },
  async trends(req: FastifyRequest): Promise<CustomerTrendsResponse> {
    const { refresh } = refreshQuerySchema.parse(req.query);
    const { dataset, cacheHit } = await adminDashboardService.getDataset(refresh);
    return { data: computeTrends(dataset.cases), meta: adminDashboardService.buildMeta(dataset, cacheHit) };
  },
};
