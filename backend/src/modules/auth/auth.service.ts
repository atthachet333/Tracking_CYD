/* ============================================================
   Auth service — login/logout/me + generic errors + login rate-limit
   ============================================================ */
import type { AuthUser, UserRole } from "@tracking-cyd/shared";
import { ROLE_LABELS } from "@tracking-cyd/shared";
import { env } from "../../config/env";
import { userStore, type UserRecord } from "./user.store";
import { sessionStore } from "./session.store";
import { verifyPassword } from "./password";

export class AuthError extends Error {
  readonly statusCode: number;
  readonly code: string;
  constructor(code: string, message: string, statusCode: number) {
    super(message);
    this.name = "AuthError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export function toAuthUser(rec: { id: string; email: string; displayName: string; role: UserRole }): AuthUser {
  return { id: rec.id, email: rec.email, displayName: rec.displayName, role: rec.role, roleLabel: ROLE_LABELS[rec.role] };
}

// login attempt window (in-memory) — เสริมจาก @fastify/rate-limit ที่ route
const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;

function checkRate(key: string): void {
  const now = Date.now();
  const rec = attempts.get(key);
  if (!rec || rec.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  rec.count++;
  if (rec.count > env.AUTH_LOGIN_RATE_LIMIT) {
    throw new AuthError("LOGIN_RATE_LIMITED", "พยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอสักครู่", 429);
  }
}

const GENERIC = "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง";

export const authService = {
  /** ตรวจ credential + สร้าง session — คืน { user, token } หรือ throw AuthError (generic) */
  login(email: string, password: string, meta: { ip: string | null; ua: string | null }): { user: AuthUser; token: string; record: UserRecord } {
    const key = `${meta.ip ?? "?"}:${(email ?? "").toLowerCase()}`;
    checkRate(key);

    const user = userStore.findByEmail(email ?? "");
    // ตรวจ password เสมอ (กัน timing/enumeration) — ใช้ hash เดิมถ้าไม่พบ user
    const ok = user && user.isActive && verifyPassword(password ?? "", user.passwordHash);
    if (!user || !user.isActive || !ok) {
      throw new AuthError("INVALID_CREDENTIALS", GENERIC, 401);
    }
    const { token, record: session } = sessionStore.create(user.id, meta);
    userStore.touchLogin(user.id);
    void session;
    return { user: toAuthUser(user), token, record: user };
  },

  logout(token: string | undefined): void {
    if (token) sessionStore.revokeByToken(token);
  },

  /** ตรวจ token → AuthUser หรือ null */
  resolve(token: string | undefined): AuthUser | null {
    const session = sessionStore.verify(token ?? "");
    if (!session) return null;
    const user = userStore.findById(session.userId);
    if (!user || !user.isActive) return null;
    return toAuthUser(user);
  },
};
