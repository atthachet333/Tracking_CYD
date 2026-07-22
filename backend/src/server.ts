import { randomUUID } from "node:crypto";
import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { apiRoutes } from "./routes/apiRoutes";
import { syncRoutes } from "./modules/sync/sync.routes";
import { customerDashboardRoutes } from "./modules/customer-dashboard/customer-dashboard.routes";
import { documentsDashboardRoutes } from "./modules/documents-dashboard/documents-dashboard.routes";
import { unifiedTasksRoutes } from "./modules/unified-tasks/unified-tasks.routes";
import { errorHandler } from "./middleware/errorHandler";
import { env, isGoogleConfigured, missingGoogleEnv } from "./config/env";

/** สร้าง instance (แยกจาก listen เพื่อทดสอบด้วย .inject ได้) */
export async function buildServer(): Promise<FastifyInstance> {
  const app = Fastify({
    genReqId: () => randomUUID(),
    logger: {
      redact: ["req.headers.authorization", "GOOGLE_PRIVATE_KEY"],
      transport:
        env.NODE_ENV === "production"
          ? undefined
          : { target: "pino-pretty", options: { translateTime: "HH:MM:ss", ignore: "pid,hostname" } },
    },
  });

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, { origin: [env.FRONTEND_ORIGIN], credentials: true });
  await app.register(rateLimit, { global: false, max: 100, timeWindow: "1 minute" });

  // แนบ x-request-id ทุก response
  app.addHook("onSend", async (req, reply) => {
    reply.header("x-request-id", req.id);
  });

  app.setErrorHandler(errorHandler);

  await app.register(apiRoutes, { prefix: "/api" });
  await app.register(syncRoutes, { prefix: "/api" });
  await app.register(customerDashboardRoutes, { prefix: "/api" });
  await app.register(documentsDashboardRoutes, { prefix: "/api" });
  await app.register(unifiedTasksRoutes, { prefix: "/api" });

  app.get("/", async () => ({ service: "tracking-cyd-backend", health: "/api/health" }));

  return app;
}

async function start(): Promise<void> {
  const app = await buildServer();

  // แจ้งเตือนถ้ายังไม่ตั้งค่า Google Sheets (ไม่ crash)
  if (!isGoogleConfigured()) {
    app.log.warn(`Google Sheets ยังไม่ถูกตั้งค่า — ขาด: ${missingGoogleEnv().join(", ")} (ระบบยังทำงานได้ แต่ /api/sheets/* จะคืน error จนกว่าจะตั้งค่า)`);
  }

  const shutdown = async (signal: string) => {
    app.log.info(`ได้รับสัญญาณ ${signal} — กำลังปิดเซิร์ฟเวอร์`);
    await app.close();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  try {
    await app.listen({ port: env.BACKEND_PORT, host: "0.0.0.0" });
    app.log.info(`🚀 Backend พร้อมใช้งานที่ http://localhost:${env.BACKEND_PORT}/api`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

if (env.NODE_ENV !== "test") {
  void start();
}
