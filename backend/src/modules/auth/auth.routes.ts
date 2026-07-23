/* ============================================================
   Auth routes — /api/auth/* + /api/audit-logs (admin)
   ============================================================ */
import type { FastifyInstance } from "fastify";
import { authController } from "./auth.controller";
import { requireAuth, requirePermission } from "./auth.middleware";
import { auditStore } from "./audit.store";
import { auditQuerySchema } from "../../schemas/index";

const loginRateLimit = { config: { rateLimit: { max: 5, timeWindow: "1 minute" } } };

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post("/auth/login", loginRateLimit, (req, reply) => authController.login(req, reply));
  app.post("/auth/logout", { preHandler: requireAuth }, (req, reply) => authController.logout(req, reply));
  app.get("/auth/me", { preHandler: requireAuth }, (req) => authController.me(req));

  // Audit logs — admin เท่านั้น
  app.get("/audit-logs", { preHandler: requirePermission("auditRead") }, (req) => {
    const q = auditQuerySchema.parse(req.query);
    return auditStore.query(q);
  });
}
