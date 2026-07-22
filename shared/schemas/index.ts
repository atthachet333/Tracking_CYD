/* ============================================================
   @tracking-cyd/shared · Zod Schemas
   ใช้ validate ข้อมูลทั้งฝั่ง API และ query params
   ============================================================ */
import { z } from "zod";

export const loadLevelSchema = z.enum(["high", "mid", "low"]);
export const taskStatusSchema = z.enum(["wait", "prog", "near", "over", "done"]);
export const docStatusSchema = z.enum(["wait", "back", "done"]);

export const employeeSchema = z.object({
  id: z.number(),
  name: z.string(),
  role: z.string(),
  dept: z.string(),
  load: loadLevelSchema,
  active: z.number(),
  done: z.number(),
  sla: z.number(),
  online: z.boolean(),
  img: z.number(),
  perf: z.number(),
  email: z.string(),
  phone: z.string(),
  trend: z.array(z.number()),
  leaveLeft: z.number(),
  joinYear: z.string(),
});

export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  customer: z.string(),
  owner: z.string(),
  ownerImg: z.number(),
  status: taskStatusSchema,
  statusText: z.string(),
  due: z.string(),
  progress: z.number(),
  priority: loadLevelSchema,
  sla: z.number(),
});

/** query params มาตรฐานสำหรับ list endpoints */
export const listQuerySchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  sort: z.string().optional(),
});

export type ListQuery = z.infer<typeof listQuerySchema>;
