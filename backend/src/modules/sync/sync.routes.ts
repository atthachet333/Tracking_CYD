/* ============================================================
   Sync Routes (Fastify plugin) — ลงทะเบียนภายใต้ /api
   - GET  /api/sheets/status
   - POST /api/sync/admin/p-kim  (rate limited + กัน sync ซ้อน 409)
   ============================================================ */
import type { FastifyInstance } from "fastify";
import { syncController } from "./sync.controller";
import { ADMIN_SYNC_SOURCES } from "./admin-sources";

const rateLimitConfig = { config: { rateLimit: { max: 5, timeWindow: "1 minute" } } };

export async function syncRoutes(app: FastifyInstance): Promise<void> {
  app.get("/sheets/status", () => syncController.status());

  // สรุปยอดจาก Sheet 2 → แสดง (GET) / เขียนลงแท็บ SUMMARY ของ Sheet 1 (POST)
  app.get("/sheets/summary", () => syncController.summary());
  app.post("/sheets/summary/rebuild", rateLimitConfig, () => syncController.rebuildSummary());

  for (const source of ADMIN_SYNC_SOURCES) {
    app.post(`/sync/admin/${source.slug}`, rateLimitConfig, () => syncController.syncAdminSource(source.slug));
  }
  app.post("/sync/admin/all", rateLimitConfig, () => syncController.syncAdminAll());
}
