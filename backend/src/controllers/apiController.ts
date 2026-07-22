/* ============================================================
   API Controller — dashboard + entity endpoints
   Controller เรียก Application Service เท่านั้น
   ============================================================ */
import type { FastifyRequest } from "fastify";
import type { HealthResponse } from "@tracking-cyd/shared";
import { listQuerySchema } from "@tracking-cyd/shared";
import { dashboardService } from "../services/dashboardService";
import {
  employeeService, taskService, documentService, customerService, notificationService, reportService,
} from "../services/entityService";
import { googleSheetsService } from "../integrations/google-sheets/google-sheets.service";
import { NotFoundError } from "../middleware/errorHandler";

export const apiController = {
  async health(): Promise<HealthResponse> {
    let connected = false;
    const configured = googleSheetsService.isConfigured();
    if (configured) {
      try {
        connected = (await googleSheetsService.getStatus()).connected;
      } catch {
        connected = false;
      }
    }
    return {
      status: "ok",
      service: "tracking-cyd-backend",
      timestamp: new Date().toISOString(),
      dependencies: { googleSheets: { configured, connected } },
    };
  },

  dashboardSummary() {
    return dashboardService.getSummary();
  },
  dashboardTrends() {
    return dashboardService.getTrends();
  },
  dashboardInsights() {
    return dashboardService.getInsights();
  },

  employees(req: FastifyRequest) {
    return employeeService.list(listQuerySchema.parse(req.query));
  },
  orgChart() {
    return employeeService.orgChart();
  },
  async employeeById(req: FastifyRequest<{ Params: { id: string } }>) {
    const emp = await employeeService.getById(Number(req.params.id));
    if (!emp) throw new NotFoundError(`ไม่พบพนักงาน id=${req.params.id}`);
    return emp;
  },

  tasks(req: FastifyRequest) {
    return taskService.list(listQuerySchema.parse(req.query));
  },
  documents(req: FastifyRequest) {
    return documentService.list(listQuerySchema.parse(req.query));
  },
  approvals() {
    return documentService.approvals();
  },
  customers(req: FastifyRequest) {
    return customerService.list(listQuerySchema.parse(req.query));
  },
  reports() {
    return reportService.get();
  },
  notifications() {
    return notificationService.list();
  },
};
