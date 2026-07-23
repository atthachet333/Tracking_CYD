/* ============================================================
   Auth controller — login/logout/me (+ audit, cookie)
   ============================================================ */
import type { FastifyReply, FastifyRequest } from "fastify";
import type { LoginResponse, AuthUser } from "@tracking-cyd/shared";
import { env, isProd } from "../../config/env";
import { loginBodySchema } from "../../schemas/index";
import { authService, AuthError } from "./auth.service";
import { auditStore } from "./audit.store";

function setSessionCookie(reply: FastifyReply, token: string): void {
  reply.setCookie(env.AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd(),
    path: "/",
    maxAge: env.AUTH_SESSION_TTL_SECONDS,
  });
}

function ipUa(req: FastifyRequest): { ip: string | null; ua: string | null } {
  return { ip: req.ip ?? null, ua: (req.headers["user-agent"] as string | undefined) ?? null };
}

export const authController = {
  async login(req: FastifyRequest, reply: FastifyReply): Promise<LoginResponse | void> {
    const body = loginBodySchema.parse(req.body);
    const meta = ipUa(req);
    try {
      const { user, token } = authService.login(body.email, body.password, meta);
      setSessionCookie(reply, token);
      auditStore.record({
        actorUserId: user.id, actorEmail: user.email, actorRole: user.role,
        action: "LOGIN_SUCCESS", resourceType: "auth", result: "success",
        requestId: req.id, ipAddress: meta.ip, userAgent: meta.ua, metadata: {},
      });
      return { user };
    } catch (err) {
      const e = err instanceof AuthError ? err : new AuthError("LOGIN_FAILED", "เข้าสู่ระบบไม่สำเร็จ", 500);
      // audit โดยไม่เก็บ password
      auditStore.record({
        actorUserId: null, actorEmail: (body.email ?? "").toLowerCase(), actorRole: null,
        action: "LOGIN_FAILED", resourceType: "auth", result: "failure",
        requestId: req.id, ipAddress: meta.ip, userAgent: meta.ua, metadata: { code: e.code },
      });
      reply.code(e.statusCode).send({ error: { code: e.code, message: e.message, details: [], requestId: req.id } });
    }
  },

  async me(req: FastifyRequest): Promise<{ user: AuthUser }> {
    // requireAuth preHandler ตั้ง req.actor แล้ว
    return { user: req.actor! };
  },

  async logout(req: FastifyRequest, reply: FastifyReply): Promise<{ ok: true }> {
    const token = req.cookies?.[env.AUTH_COOKIE_NAME];
    const actor = req.actor ?? null;
    authService.logout(token);
    reply.clearCookie(env.AUTH_COOKIE_NAME, { path: "/" });
    if (actor) {
      auditStore.record({
        actorUserId: actor.id, actorEmail: actor.email, actorRole: actor.role,
        action: "LOGOUT", resourceType: "auth", result: "success",
        requestId: req.id, ipAddress: req.ip ?? null, userAgent: (req.headers["user-agent"] as string) ?? null, metadata: {},
      });
    }
    return { ok: true };
  },
};
