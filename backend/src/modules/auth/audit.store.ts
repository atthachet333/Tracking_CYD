/* ============================================================
   Audit log store (file-backed, append-only JSONL)
   - ห้ามเก็บ password / token / private key / cookie
   ============================================================ */
import { randomUUID } from "node:crypto";
import type { AuditLogItem, UserRole } from "@tracking-cyd/shared";
import { dataFile, appendJsonl, readJsonl } from "./file-db";

const FILE = () => dataFile("audit-logs.jsonl");

/** คีย์ที่ห้ามหลุดเข้า metadata (กันข้อมูลอ่อนไหว) */
const FORBIDDEN_KEYS = /pass|token|secret|cookie|authorization|privatekey|private_key|credential/i;

function sanitize(meta: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta ?? {})) {
    if (FORBIDDEN_KEYS.test(k)) { out[k] = "[redacted]"; continue; }
    out[k] = typeof v === "string" && v.length > 500 ? `${v.slice(0, 500)}…` : v;
  }
  return out;
}

export interface AuditInput {
  actorUserId: string | null;
  actorEmail: string | null;
  actorRole: UserRole | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  result: "success" | "failure";
  requestId: string;
  ipAddress: string | null;
  userAgent: string | null;
  metadata?: Record<string, unknown>;
}

export const auditStore = {
  record(input: AuditInput): AuditLogItem {
    const item: AuditLogItem = {
      id: randomUUID(),
      actorUserId: input.actorUserId,
      actorEmail: input.actorEmail,
      actorRole: input.actorRole,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId ?? null,
      result: input.result,
      requestId: input.requestId,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      metadata: sanitize(input.metadata ?? {}),
      createdAt: new Date().toISOString(),
    };
    appendJsonl(FILE(), item);
    return item;
  },

  query(opts: { page: number; pageSize: number; action?: string; actor?: string; result?: string; dateFrom?: string; dateTo?: string }) {
    let rows = readJsonl<AuditLogItem>(FILE()).reverse(); // ใหม่สุดก่อน
    if (opts.action) rows = rows.filter((r) => r.action === opts.action);
    if (opts.actor) { const a = opts.actor.toLowerCase(); rows = rows.filter((r) => (r.actorEmail ?? "").toLowerCase().includes(a)); }
    if (opts.result) rows = rows.filter((r) => r.result === opts.result);
    if (opts.dateFrom) rows = rows.filter((r) => r.createdAt >= opts.dateFrom!);
    if (opts.dateTo) rows = rows.filter((r) => r.createdAt <= opts.dateTo!);
    const total = rows.length;
    const totalPages = Math.max(1, Math.ceil(total / opts.pageSize));
    const page = Math.min(Math.max(1, opts.page), totalPages);
    const data = rows.slice((page - 1) * opts.pageSize, page * opts.pageSize);
    return { data, pagination: { page, pageSize: opts.pageSize, total, totalPages } };
  },
};
