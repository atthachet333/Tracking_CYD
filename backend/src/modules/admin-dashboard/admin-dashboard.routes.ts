/* Admin Dashboard Routes — /api/admin-dashboard/* */
import type { FastifyInstance } from "fastify";
import { adminDashboardController as c } from "./admin-dashboard.controller";

export async function adminDashboardRoutes(app: FastifyInstance): Promise<void> {
  app.get("/admin-dashboard/summary", (req) => c.summary(req));
  app.get("/admin-dashboard/status-distribution", (req) => c.statusDistribution(req));
  app.get("/admin-dashboard/assignees", (req) => c.assignees(req));
  app.get("/admin-dashboard/companies", (req) => c.companies(req));
  app.get("/admin-dashboard/recent-items", (req) => c.recentItems(req));
  app.get("/admin-dashboard/problem-items", (req) => c.problemItems(req));
  app.get("/admin-dashboard/in-progress-items", (req) => c.inProgressItems(req));
  app.get("/admin-dashboard/trends", (req) => c.trends(req));
}
