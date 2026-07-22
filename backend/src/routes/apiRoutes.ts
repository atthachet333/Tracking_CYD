import type { FastifyInstance } from "fastify";
import { apiController as c } from "../controllers/apiController";
import { sheetsController as s } from "../controllers/sheetsController";

/** ลงทะเบียนเส้นทาง REST ทั้งหมดภายใต้ prefix /api */
export async function apiRoutes(app: FastifyInstance): Promise<void> {
  // Health
  app.get("/health", c.health);

  // Google Sheets integration (สถานะ source/target อยู่ใน sync.routes.ts)
  app.get("/sheets/metadata", s.metadata);
  app.get("/sheets/headers", s.headers);
  app.get("/sheets/rows", s.rows);
  app.post("/sheets/refresh", { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } }, s.refresh);

  // Dashboard (คำนวณจาก cases)
  app.get("/dashboard/summary", c.dashboardSummary);
  app.get("/dashboard/trends", c.dashboardTrends);
  app.get("/dashboard/insights", c.dashboardInsights);

  // Entities (derived จาก cases; เอกสาร/อนุมัติ/แจ้งเตือน = ว่างจนกว่าจะมีแหล่งข้อมูล)
  app.get("/employees", c.employees);
  app.get("/employees/org-chart", c.orgChart);
  app.get<{ Params: { id: string } }>("/employees/:id", c.employeeById);
  app.get("/tasks", c.tasks);
  app.get("/documents", c.documents);
  app.get("/approvals", c.approvals);
  app.get("/customers", c.customers);
  app.get("/reports", c.reports);
  app.get("/notifications", c.notifications);
}
