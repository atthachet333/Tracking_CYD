/* ============================================================
   Auth middleware (Fastify preHandlers) — ตรวจ session cookie + role
   - Backend เป็นผู้ตัดสินสิทธิ์สุดท้าย (ไม่เชื่อ frontend)
   ============================================================ */
import type { FastifyReply, FastifyRequest } from "fastify";
import type { AuthUser, Permission, UserRole } from "@tracking-cyd/shared";
import { hasPermission } from "@tracking-cyd/shared";
import { env } from "../../config/env";
import { authService } from "./auth.service";

declare module "fastify" {
  interface FastifyRequest {
    actor?: AuthUser | null;
  }
}

export interface ActorContext {
  userId: string;
  email: string;
  role: UserRole;
  requestId: string;
  ipAddress: string | null;
  userAgent: string | null;
}

function tokenOf(req: FastifyRequest): string | undefined {
  return req.cookies?.[env.AUTH_COOKIE_NAME];
}

function send401(req: FastifyRequest, reply: FastifyReply): void {
  reply.code(401).send({ error: { code: "UNAUTHENTICATED", message: "กรุณาเข้าสู่ระบบ", details: [], requestId: req.id } });
}
function send403(req: FastifyRequest, reply: FastifyReply): void {
  reply.code(403).send({ error: { code: "FORBIDDEN", message: "คุณไม่มีสิทธิ์เข้าถึง", details: [], requestId: req.id } });
}

/** แนบ actor ถ้ามี session (ไม่บังคับ) */
export async function optionalAuth(req: FastifyRequest): Promise<void> {
  req.actor = authService.resolve(tokenOf(req));
}

/** ต้องล็อกอิน */
export async function requireAuth(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  req.actor = authService.resolve(tokenOf(req));
  if (!req.actor) return send401(req, reply);
}

/** ต้องมีสิทธิ์ตาม permission (แหล่งความจริง = PERMISSIONS matrix) */
export function requirePermission(permission: Permission) {
  return async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    req.actor = authService.resolve(tokenOf(req));
    if (!req.actor) return send401(req, reply);
    if (!hasPermission(req.actor.role, permission)) return send403(req, reply);
  };
}

/** ต้องเป็น role ที่กำหนด */
export function requireRole(...roles: UserRole[]) {
  return async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    req.actor = authService.resolve(tokenOf(req));
    if (!req.actor) return send401(req, reply);
    if (!roles.includes(req.actor.role)) return send403(req, reply);
  };
}

/** path ที่ไม่ต้องล็อกอิน */
const PUBLIC_PATHS = new Set(["/api/health", "/api/auth/login"]);

/**
 * Global gate — ทุก /api/* ต้องล็อกอิน ยกเว้น allowlist
 * (write routes ยังมี requirePermission ของตัวเองเป็น defense-in-depth)
 */
export async function authGate(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (req.method === "OPTIONS") return;
  const path = (req.routeOptions?.url ?? req.url).split("?")[0];
  if (!path.startsWith("/api/")) return;
  if (PUBLIC_PATHS.has(path)) return;
  req.actor = authService.resolve(tokenOf(req));
  if (!req.actor) return send401(req, reply);
}

/** สร้าง ActorContext จาก request (สำหรับ audit + defense-in-depth) */
export function buildActor(req: FastifyRequest): ActorContext | null {
  if (!req.actor) return null;
  return {
    userId: req.actor.id,
    email: req.actor.email,
    role: req.actor.role,
    requestId: req.id,
    ipAddress: req.ip ?? null,
    userAgent: (req.headers["user-agent"] as string | undefined) ?? null,
  };
}
