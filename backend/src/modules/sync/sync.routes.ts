/* ============================================================
   Sync Routes (Fastify plugin) — ลงทะเบียนภายใต้ /api
   - GET  /api/sheets/status, /api/sheets/summary (read — ทุก role ที่ล็อกอิน)
   - POST /api/sync/admin/*, /api/sheets/summary/rebuild (WRITE — admin เท่านั้น + audit)
   ============================================================ */
import type { FastifyInstance, FastifyRequest } from "fastify";
import { syncController } from "./sync.controller";
import { ADMIN_SYNC_SOURCES } from "./admin-sources";
import { requirePermission, buildActor } from "../auth/auth.middleware";
import { auditStore } from "../auth/audit.store";
import { GoogleSheetsError } from "../../integrations/google-sheets/google-sheets.errors";

const rateLimitConfig = { config: { rateLimit: { max: 5, timeWindow: "1 minute" } } };

/** ยืนยันว่า actor เป็น admin ก่อนเขียน (defense-in-depth เพิ่มจาก preHandler) */
function assertAdmin(req: FastifyRequest): void {
  const actor = buildActor(req);
  if (!actor || actor.role !== "admin") {
    throw new GoogleSheetsError("SHEET_SYNC_FAILED", "ต้องมีสิทธิ์ผู้ดูแลระบบ");
  }
}

/** run write action + audit (success/failure) */
async function auditedWrite<T>(
  req: FastifyRequest, action: string, resourceId: string, fn: () => Promise<T>,
): Promise<T> {
  assertAdmin(req);
  const actor = buildActor(req)!;
  const base = { actorUserId: actor.userId, actorEmail: actor.email, actorRole: actor.role, requestId: actor.requestId, ipAddress: actor.ipAddress, userAgent: actor.userAgent };
  try {
    const result = await fn();
    const r = result as { rowsRead?: number; rowsWritten?: number };
    auditStore.record({ ...base, action, resourceType: "google-sheets", resourceId, result: "success", metadata: { rowsRead: r.rowsRead ?? null, rowsWritten: r.rowsWritten ?? null } });
    return result;
  } catch (err) {
    const code = err instanceof GoogleSheetsError ? err.code : "SHEET_SYNC_FAILED";
    auditStore.record({ ...base, action, resourceType: "google-sheets", resourceId, result: "failure", metadata: { code } });
    throw err;
  }
}

export async function syncRoutes(app: FastifyInstance): Promise<void> {
  // Read (ต้องล็อกอิน — gate จัดการแล้ว)
  app.get("/sheets/status", () => syncController.status());
  app.get("/sheets/summary", () => syncController.summary());

  // Rebuild SUMMARY (WRITE — admin)
  app.post("/sheets/summary/rebuild", { ...rateLimitConfig, preHandler: requirePermission("rebuildExecute") },
    (req) => auditedWrite(req, "REBUILD_SUMMARY", "SUMMARY", () => syncController.rebuildSummary()));

  // Sync ต้นทาง → ADMIN (WRITE — admin)
  for (const source of ADMIN_SYNC_SOURCES) {
    app.post(`/sync/admin/${source.slug}`, { ...rateLimitConfig, preHandler: requirePermission("syncExecute") },
      (req) => auditedWrite(req, "SYNC_ADMIN", source.slug, () => syncController.syncAdminSource(source.slug)));
  }
  app.post("/sync/admin/all", { ...rateLimitConfig, preHandler: requirePermission("syncExecute") },
    (req) => auditedWrite(req, "SYNC_ALL", "all", () => syncController.syncAdminAll()));
}
