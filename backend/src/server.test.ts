import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import type { FastifyInstance } from "fastify";

const GOOGLE_ENV_KEYS = [
  "GOOGLE_SERVICE_ACCOUNT_EMAIL",
  "GOOGLE_PRIVATE_KEY",
  "GOOGLE_SOURCE_SPREADSHEET_ID",
  "GOOGLE_TARGET_SPREADSHEET_ID",
  "GOOGLE_SHEETS_SPREADSHEET_ID",
] as const;

/** ทดสอบพฤติกรรมเมื่อ "ยังไม่ได้ตั้ง Google credentials" (empty-state path) */
describe("Backend API — ยังไม่ตั้งค่า Google Sheets", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    for (const key of GOOGLE_ENV_KEYS) delete process.env[key];
    vi.resetModules();
    const { buildServer } = await import("./server");
    app = await buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /api/health → 200 และ dependency googleSheets.configured=false", async () => {
    const res = await app.inject({ method: "GET", url: "/api/health" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe("ok");
    expect(body.service).toBe("tracking-cyd-backend");
    expect(body.dependencies.googleSheets.configured).toBe(false);
  });

  it("GET /api/sheets/status → configured=false + มี source/target", async () => {
    const res = await app.inject({ method: "GET", url: "/api/sheets/status" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.configured).toBe(false);
    expect(body.connected).toBe(false);
    expect(body.source).toEqual({ connected: false, spreadsheetId: null, spreadsheetTitle: null, sheets: [] });
    expect(body.target).toEqual({ connected: false, spreadsheetId: null, spreadsheetTitle: null, sheets: [] });
  });

  it("POST /api/sync/admin/p-kim → 503 GOOGLE_SHEETS_NOT_CONFIGURED (ยังไม่ตั้ง credential)", async () => {
    const res = await app.inject({ method: "POST", url: "/api/sync/admin/p-kim" });
    expect(res.statusCode).toBe(503);
    expect(res.json().error.code).toBe("GOOGLE_SHEETS_NOT_CONFIGURED");
  });

  it("GET /api/sheets/metadata → 503 GOOGLE_SHEETS_NOT_CONFIGURED", async () => {
    const res = await app.inject({ method: "GET", url: "/api/sheets/metadata" });
    expect(res.statusCode).toBe(503);
    const body = res.json();
    expect(body.error.code).toBe("GOOGLE_SHEETS_NOT_CONFIGURED");
    expect(body.error.requestId).toBeTruthy();
  });

  it("GET /api/customer-dashboard/summary → 503 GOOGLE_SHEETS_NOT_CONFIGURED", async () => {
    const res = await app.inject({ method: "GET", url: "/api/customer-dashboard/summary" });
    expect(res.statusCode).toBe(503);
    expect(res.json().error.code).toBe("GOOGLE_SHEETS_NOT_CONFIGURED");
  });

  it("GET /api/customer-dashboard/problem-cases → 503 (มี route + validation ผ่าน)", async () => {
    const res = await app.inject({ method: "GET", url: "/api/customer-dashboard/problem-cases?page=1&pageSize=20" });
    expect(res.statusCode).toBe(503);
    expect(res.json().error.code).toBe("GOOGLE_SHEETS_NOT_CONFIGURED");
  });

  it("GET /api/documents-dashboard/summary → 503 GOOGLE_SHEETS_NOT_CONFIGURED", async () => {
    const res = await app.inject({ method: "GET", url: "/api/documents-dashboard/summary" });
    expect(res.statusCode).toBe(503);
    expect(res.json().error.code).toBe("GOOGLE_SHEETS_NOT_CONFIGURED");
  });

  it("GET /api/documents-dashboard/items → 503 (route + validation ผ่าน)", async () => {
    const res = await app.inject({ method: "GET", url: "/api/documents-dashboard/items?page=1&pageSize=20&department=documents" });
    expect(res.statusCode).toBe(503);
  });

  it("GET /api/tasks/unified → 503 GOOGLE_SHEETS_NOT_CONFIGURED", async () => {
    const res = await app.inject({ method: "GET", url: "/api/tasks/unified?page=1&pageSize=20" });
    expect(res.statusCode).toBe(503);
    expect(res.json().error.code).toBe("GOOGLE_SHEETS_NOT_CONFIGURED");
  });

  it("GET /api/dashboard/summary → KPI เป็น 0 (ไม่มี mock)", async () => {
    const res = await app.inject({ method: "GET", url: "/api/dashboard/summary" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.totalTasks).toBe(0);
    expect(body.totalEmployees).toBe(0);
    expect(body.teamSla).toBe(0);
  });

  it("GET /api/employees → รายการว่าง", async () => {
    const res = await app.inject({ method: "GET", url: "/api/employees" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data).toEqual([]);
    expect(body.total).toBe(0);
  });

  it("GET /api/dashboard/insights → แจ้งว่าข้อมูลไม่พอ", async () => {
    const res = await app.inject({ method: "GET", url: "/api/dashboard/insights" });
    expect(res.statusCode).toBe(200);
    expect(res.json()[0].title).toContain("ยังไม่มีข้อมูลเพียงพอ");
  });

  it("ทุก response มี header x-request-id", async () => {
    const res = await app.inject({ method: "GET", url: "/api/health" });
    expect(res.headers["x-request-id"]).toBeTruthy();
  });
});
