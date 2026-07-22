/* ============================================================
   Documents Dashboard Routes (Fastify plugin) — /api/documents-dashboard/*
   ============================================================ */
import type { FastifyInstance } from "fastify";
import { documentsDashboardController as c } from "./documents-dashboard.controller";

export async function documentsDashboardRoutes(app: FastifyInstance): Promise<void> {
  app.get("/documents-dashboard/summary", (req) => c.summary(req));
  app.get("/documents-dashboard/status-distribution", (req) => c.statusDistribution(req));
  app.get("/documents-dashboard/assignees", (req) => c.assignees(req));
  app.get("/documents-dashboard/workload", (req) => c.workload(req));
  app.get("/documents-dashboard/companies", (req) => c.companies(req));
  app.get("/documents-dashboard/items", (req) => c.items(req));
  app.get("/documents-dashboard/recent-items", (req) => c.recentItems(req));
  app.get("/documents-dashboard/problem-items", (req) => c.problemItems(req));
  app.get("/documents-dashboard/trends", (req) => c.trends(req));
  app.get("/documents-dashboard/headers", (req) => c.headers(req));
}
