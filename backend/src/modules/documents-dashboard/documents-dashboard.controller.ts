/* ============================================================
   Documents Dashboard Controller — เรียก service + calculations เท่านั้น
   ============================================================ */
import type { FastifyRequest } from "fastify";
import type {
  DocumentsSummaryResponse, DocumentsStatusDistributionResponse, DocumentsPaymentDistributionResponse,
  DocumentsAssigneesResponse, DocumentsCompaniesResponse, DocumentsItemsResponse, DocumentsRecentResponse,
  DocumentsTrendsResponse, DocumentsHeadersResponse,
} from "@tracking-cyd/shared";
import { refreshQuerySchema, documentsItemsQuerySchema } from "../../schemas/index";
import { documentsDashboardService } from "./documents-dashboard.service";
import {
  computeSummary, computeDistribution, computeActualBreakdown, computeAssignees, computeCompanies,
  computeRecent, computeTrends, computeInsights, filterItems, computePaymentDistribution, computePaymentActual,
} from "./documents-dashboard.calculations";

export const documentsDashboardController = {
  async summary(req: FastifyRequest): Promise<DocumentsSummaryResponse> {
    const { refresh } = refreshQuerySchema.parse(req.query);
    const { dataset, cacheHit } = await documentsDashboardService.getDataset(refresh);
    const data = computeSummary(dataset.items);
    const insights = computeInsights(data, computeAssignees(dataset.items));
    return { data, insights, meta: documentsDashboardService.buildMeta(dataset, cacheHit) };
  },

  async statusDistribution(req: FastifyRequest): Promise<DocumentsStatusDistributionResponse> {
    const { refresh } = refreshQuerySchema.parse(req.query);
    const { dataset, cacheHit } = await documentsDashboardService.getDataset(refresh);
    return { data: computeDistribution(dataset.items), actual: computeActualBreakdown(dataset.items), meta: documentsDashboardService.buildMeta(dataset, cacheHit) };
  },

  async paymentDistribution(req: FastifyRequest): Promise<DocumentsPaymentDistributionResponse> {
    const { refresh } = refreshQuerySchema.parse(req.query);
    const { dataset, cacheHit } = await documentsDashboardService.getDataset(refresh);
    return { data: computePaymentDistribution(dataset.items), actual: computePaymentActual(dataset.items), meta: documentsDashboardService.buildMeta(dataset, cacheHit) };
  },

  async assignees(req: FastifyRequest): Promise<DocumentsAssigneesResponse> {
    const { refresh } = refreshQuerySchema.parse(req.query);
    const { dataset, cacheHit } = await documentsDashboardService.getDataset(refresh);
    return { data: computeAssignees(dataset.items), meta: documentsDashboardService.buildMeta(dataset, cacheHit) };
  },

  /** workload = สถิติรายพนักงาน (alias ของ assignees) */
  async workload(req: FastifyRequest): Promise<DocumentsAssigneesResponse> {
    return this.assignees(req);
  },

  async companies(req: FastifyRequest): Promise<DocumentsCompaniesResponse> {
    const { refresh } = refreshQuerySchema.parse(req.query);
    const { dataset, cacheHit } = await documentsDashboardService.getDataset(refresh);
    return { data: computeCompanies(dataset.items), meta: documentsDashboardService.buildMeta(dataset, cacheHit) };
  },

  async recentItems(req: FastifyRequest): Promise<DocumentsRecentResponse> {
    const { refresh } = refreshQuerySchema.parse(req.query);
    const { dataset, cacheHit } = await documentsDashboardService.getDataset(refresh);
    return { data: computeRecent(dataset.items, 20), meta: documentsDashboardService.buildMeta(dataset, cacheHit) };
  },

  async problemItems(req: FastifyRequest): Promise<DocumentsRecentResponse> {
    const { refresh } = refreshQuerySchema.parse(req.query);
    const { dataset, cacheHit } = await documentsDashboardService.getDataset(refresh);
    return { data: dataset.items.filter((i) => i.statusGroup === "issues"), meta: documentsDashboardService.buildMeta(dataset, cacheHit) };
  },

  async trends(req: FastifyRequest): Promise<DocumentsTrendsResponse> {
    const { refresh } = refreshQuerySchema.parse(req.query);
    const { dataset, cacheHit } = await documentsDashboardService.getDataset(refresh);
    return { data: computeTrends(dataset.items), meta: documentsDashboardService.buildMeta(dataset, cacheHit) };
  },

  async items(req: FastifyRequest): Promise<DocumentsItemsResponse> {
    const q = documentsItemsQuerySchema.parse(req.query);
    const { dataset, cacheHit } = await documentsDashboardService.getDataset(q.refresh);
    const { data, pagination } = filterItems(dataset.items, {
      search: q.search, status: q.status, statusGroup: q.statusGroup, paymentStatus: q.paymentStatus, paymentGroup: q.paymentGroup,
      assignee: q.assignee, company: q.company, dateFrom: q.dateFrom, dateTo: q.dateTo, sortBy: q.sortBy, sortOrder: q.sortOrder,
      page: q.page, pageSize: q.pageSize,
    });
    return { data, pagination, meta: documentsDashboardService.buildMeta(dataset, cacheHit) };
  },

  async headers(req: FastifyRequest): Promise<DocumentsHeadersResponse> {
    const { refresh } = refreshQuerySchema.parse(req.query);
    const { dataset, cacheHit } = await documentsDashboardService.getDataset(refresh);
    const { mapping, unmapped } = documentsDashboardService.getMapping();
    return { headers: dataset.headers, mapping, unmapped, preview: dataset.preview, meta: documentsDashboardService.buildMeta(dataset, cacheHit) };
  },
};
