import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { FastifyInstance, InjectOptions } from "fastify";

const GOOGLE_ENV_KEYS = [
  "GOOGLE_SERVICE_ACCOUNT_EMAIL", "GOOGLE_PRIVATE_KEY",
  "GOOGLE_SOURCE_SPREADSHEET_ID", "GOOGLE_TARGET_SPREADSHEET_ID", "GOOGLE_SHEETS_SPREADSHEET_ID",
] as const;

const ADMIN = { email: "admin@test.local", password: "admin-pass-123" };
const EXEC = { email: "exec@test.local", password: "exec-pass-123" };

function cookieFrom(res: { headers: Record<string, unknown> }): string {
  const sc = res.headers["set-cookie"];
  const raw = Array.isArray(sc) ? sc[0] : (sc as string);
  return raw.split(";")[0];
}

describe("Backend API — Auth + RBAC (ยังไม่ตั้งค่า Google Sheets)", () => {
  let app: FastifyInstance;
  let dataDir: string;
  let adminCookie = "";
  let execCookie = "";

  const inject = (opts: InjectOptions, cookie?: string) =>
    app.inject({ ...opts, headers: { ...(opts.headers ?? {}), ...(cookie ? { cookie } : {}) } });

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    for (const key of GOOGLE_ENV_KEYS) delete process.env[key];
    dataDir = mkdtempSync(join(tmpdir(), "cyd-auth-"));
    process.env.AUTH_DATA_DIR = dataDir;
    process.env.BOOTSTRAP_ADMIN_EMAIL = ADMIN.email;
    process.env.BOOTSTRAP_ADMIN_PASSWORD = ADMIN.password;
    process.env.BOOTSTRAP_EXECUTIVE_EMAIL = EXEC.email;
    process.env.BOOTSTRAP_EXECUTIVE_PASSWORD = EXEC.password;
    vi.resetModules();
    const { buildServer } = await import("./server");
    const { bootstrapUsers } = await import("./modules/auth/user.store");
    app = await buildServer();
    await app.ready();
    bootstrapUsers();

    const a = await app.inject({ method: "POST", url: "/api/auth/login", payload: ADMIN });
    adminCookie = cookieFrom(a);
    const e = await app.inject({ method: "POST", url: "/api/auth/login", payload: EXEC });
    execCookie = cookieFrom(e);
  }, 30000);

  afterAll(async () => {
    await app.close();
    rmSync(dataDir, { recursive: true, force: true });
  });

  it("GET /api/health → 200 (public, ไม่ต้องล็อกอิน)", async () => {
    const res = await app.inject({ method: "GET", url: "/api/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json().dependencies.googleSheets.configured).toBe(false);
  });

  it("Auth: unauthenticated /api/sheets/status → 401", async () => {
    const res = await app.inject({ method: "GET", url: "/api/sheets/status" });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe("UNAUTHENTICATED");
  });

  it("Auth: login รหัสผ่านผิด → 401 generic", async () => {
    const res = await app.inject({ method: "POST", url: "/api/auth/login", payload: { email: ADMIN.email, password: "wrong" } });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.message).toBe("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
  });

  it("Auth: login ผู้ใช้ไม่มีอยู่ → 401 generic เดียวกัน (กัน enumeration)", async () => {
    const res = await app.inject({ method: "POST", url: "/api/auth/login", payload: { email: "nobody@test.local", password: "whatever-123" } });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.message).toBe("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
  });

  it("Auth: /api/auth/me admin → role=admin, ไม่มี passwordHash", async () => {
    const res = await inject({ method: "GET", url: "/api/auth/me" }, adminCookie);
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.user.role).toBe("admin");
    expect(body.user.roleLabel).toBe("ผู้ดูแลระบบ");
    expect(body.user.passwordHash).toBeUndefined();
  });

  it("Auth: /api/auth/me executive → role=executive/ผู้บริหาร", async () => {
    const res = await inject({ method: "GET", url: "/api/auth/me" }, execCookie);
    expect(res.json().user.role).toBe("executive");
    expect(res.json().user.roleLabel).toBe("ผู้บริหาร");
  });

  it("Auth: /api/auth/me ไม่มี cookie → 401", async () => {
    const res = await app.inject({ method: "GET", url: "/api/auth/me" });
    expect(res.statusCode).toBe(401);
  });

  it("RBAC: Executive POST /api/sync/admin/all → 403", async () => {
    const res = await inject({ method: "POST", url: "/api/sync/admin/all" }, execCookie);
    expect(res.statusCode).toBe(403);
    expect(res.json().error.code).toBe("FORBIDDEN");
  });

  it("RBAC: Executive POST /api/sheets/summary/rebuild → 403", async () => {
    const res = await inject({ method: "POST", url: "/api/sheets/summary/rebuild" }, execCookie);
    expect(res.statusCode).toBe(403);
  });

  it("RBAC: Executive GET /api/audit-logs → 403", async () => {
    const res = await inject({ method: "GET", url: "/api/audit-logs" }, execCookie);
    expect(res.statusCode).toBe(403);
  });

  it("RBAC: Admin GET /api/audit-logs → 200 (มี LOGIN_SUCCESS)", async () => {
    const res = await inject({ method: "GET", url: "/api/audit-logs?pageSize=50" }, adminCookie);
    expect(res.statusCode).toBe(200);
    const actions = res.json().data.map((r: { action: string }) => r.action);
    expect(actions).toContain("LOGIN_SUCCESS");
  });

  it("RBAC: Admin POST /api/sync/admin/p-kim → 503 (ผ่าน auth แต่ยังไม่ตั้ง Google)", async () => {
    const res = await inject({ method: "POST", url: "/api/sync/admin/p-kim" }, adminCookie);
    expect(res.statusCode).toBe(503);
    expect(res.json().error.code).toBe("GOOGLE_SHEETS_NOT_CONFIGURED");
  });

  it("Read (admin): /api/sheets/status → configured=false", async () => {
    const res = await inject({ method: "GET", url: "/api/sheets/status" }, adminCookie);
    expect(res.statusCode).toBe(200);
    expect(res.json().configured).toBe(false);
  });

  it("Read (executive): /api/customer-dashboard/summary → 503 (ยังไม่ตั้ง Google)", async () => {
    const res = await inject({ method: "GET", url: "/api/customer-dashboard/summary" }, execCookie);
    expect(res.statusCode).toBe(503);
    expect(res.json().error.code).toBe("GOOGLE_SHEETS_NOT_CONFIGURED");
  });

  it("Read (executive): /api/tasks/unified → 503", async () => {
    const res = await inject({ method: "GET", url: "/api/tasks/unified?page=1&pageSize=20" }, execCookie);
    expect(res.statusCode).toBe(503);
  });

  it("Read (executive): /api/dashboard/summary → KPI 0 (ไม่มี mock)", async () => {
    const res = await inject({ method: "GET", url: "/api/dashboard/summary" }, execCookie);
    expect(res.statusCode).toBe(200);
    expect(res.json().totalTasks).toBe(0);
  });

  it("Auth: logout → 200 แล้ว me → 401", async () => {
    const login = await app.inject({ method: "POST", url: "/api/auth/login", payload: EXEC });
    const c = cookieFrom(login);
    const out = await inject({ method: "POST", url: "/api/auth/logout" }, c);
    expect(out.statusCode).toBe(200);
    const me = await inject({ method: "GET", url: "/api/auth/me" }, c);
    expect(me.statusCode).toBe(401);
  });

  it("ทุก response มี header x-request-id", async () => {
    const res = await app.inject({ method: "GET", url: "/api/health" });
    expect(res.headers["x-request-id"]).toBeTruthy();
  });
});
