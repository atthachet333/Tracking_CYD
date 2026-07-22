/* Unified Tasks Routes — /api/tasks/unified */
import type { FastifyInstance } from "fastify";
import { unifiedTasksController } from "./unified-tasks.controller";

export async function unifiedTasksRoutes(app: FastifyInstance): Promise<void> {
  app.get("/tasks/unified", (req) => unifiedTasksController.list(req));
}
