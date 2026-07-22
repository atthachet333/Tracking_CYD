/* ============================================================
   Customer Dashboard Routes (Fastify plugin) — ลงทะเบียนภายใต้ /api
   GET /api/customer-dashboard/summary
   GET /api/customer-dashboard/status-distribution
   GET /api/customer-dashboard/recent-cases
   GET /api/customer-dashboard/trends
   GET /api/customer-dashboard/problem-cases
   ============================================================ */
import type { FastifyInstance } from "fastify";
import { customerDashboardController as c } from "./customer-dashboard.controller";

export async function customerDashboardRoutes(app: FastifyInstance): Promise<void> {
  app.get("/customer-dashboard/summary", (req) => c.summary(req));
  app.get("/customer-dashboard/status-distribution", (req) => c.statusDistribution(req));
  app.get("/customer-dashboard/actual-statuses", (req) => c.actualStatuses(req));
  app.get("/customer-dashboard/customers", (req) => c.customers(req));
  app.get("/customer-dashboard/recent-cases", (req) => c.recentCases(req));
  app.get("/customer-dashboard/problem-cases", (req) => c.problemCases(req));
  app.get("/customer-dashboard/in-progress-cases", (req) => c.inProgressCases(req));
  app.get("/customer-dashboard/completed-cases", (req) => c.completedCases(req));
  app.get("/customer-dashboard/trends", (req) => c.trends(req));
}
