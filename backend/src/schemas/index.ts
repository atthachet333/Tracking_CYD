import { z } from "zod";

// Re-export validation schemas ที่ใช้ร่วมกันจาก shared
export { listQuerySchema, employeeSchema, taskSchema } from "@tracking-cyd/shared";
export type { ListQuery } from "@tracking-cyd/shared";

/** query สำหรับ GET /api/sheets/rows */
export const sheetRowsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(50),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  sheetId: z.coerce.number().int().nonnegative().optional(),
});

export type SheetRowsQuery = z.infer<typeof sheetRowsQuerySchema>;

/** flag refresh สำหรับ customer-dashboard endpoints */
export const refreshQuerySchema = z.object({
  refresh: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .optional()
    .transform((v) => v === true || v === "true"),
});

/** query สำหรับ GET /api/customer-dashboard/problem-cases */
export const problemCasesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20),
  search: z.string().optional(),
  status: z.string().optional(),
  refresh: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .optional()
    .transform((v) => v === true || v === "true"),
});

export type ProblemCasesQuery = z.infer<typeof problemCasesQuerySchema>;

/** query สำหรับ GET /api/customer-dashboard/customers (ตารางลูกค้าทั้งหมด) */
export const customersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(2000).default(20),
  search: z.string().optional(),
  status: z.string().optional(),
  statusGroup: z.enum(["in_progress", "completed", "issues", "unclassified"]).optional(),
  assignee: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.enum(["date", "caseNo", "company", "assignee", "customerStatus"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  refresh: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .optional()
    .transform((v) => v === true || v === "true"),
});

export type CustomersQuery = z.infer<typeof customersQuerySchema>;

const boolFlag = z
  .union([z.literal("true"), z.literal("false"), z.boolean()])
  .optional()
  .transform((v) => v === true || v === "true");

/** query สำหรับ GET /api/documents-dashboard/items */
export const documentsItemsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(2000).default(20),
  search: z.string().optional(),
  status: z.string().optional(),
  statusGroup: z.enum(["in_progress", "completed", "issues", "unclassified"]).optional(),
  paymentStatus: z.string().optional(),
  paymentGroup: z.enum(["paid", "pending", "unpaid"]).optional(),
  assignee: z.string().optional(),
  company: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.enum(["workDate", "caseNo", "company", "assignee", "actualStatus", "paymentStatus"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  refresh: boolFlag,
});
export type DocumentsItemsQuery = z.infer<typeof documentsItemsQuerySchema>;

/** query สำหรับ GET /api/tasks/unified (รองรับ fetch-all สำหรับ dashboard client-side) */
export const unifiedTasksQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(2000).default(20),
  department: z.enum(["admin", "documents"]).optional(),
  search: z.string().optional(),
  status: z.string().optional(),
  statusGroup: z.enum(["in_progress", "completed", "issues", "unclassified"]).optional(),
  paymentStatus: z.string().optional(),
  assignee: z.string().optional(),
  company: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.enum(["workDate", "caseNo", "companyName", "assignee", "actualStatus", "department"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  refresh: boolFlag,
});
export type UnifiedTasksQuery = z.infer<typeof unifiedTasksQuerySchema>;
