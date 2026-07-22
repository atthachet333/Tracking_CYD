/* Unified Tasks Controller — เรียก service เท่านั้น */
import type { FastifyRequest } from "fastify";
import type { UnifiedTasksResponse } from "@tracking-cyd/shared";
import { unifiedTasksQuerySchema } from "../../schemas/index";
import { unifiedTasksService } from "./unified-tasks.service";

export const unifiedTasksController = {
  async list(req: FastifyRequest): Promise<UnifiedTasksResponse> {
    const q = unifiedTasksQuerySchema.parse(req.query);
    return unifiedTasksService.getTasks({
      department: q.department, search: q.search, status: q.status, statusGroup: q.statusGroup, paymentStatus: q.paymentStatus,
      assignee: q.assignee, company: q.company, dateFrom: q.dateFrom, dateTo: q.dateTo,
      sortBy: q.sortBy, sortOrder: q.sortOrder, page: q.page, pageSize: q.pageSize, refresh: q.refresh,
    });
  },
};
