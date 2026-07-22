import { beforeEach, describe, expect, it, vi } from "vitest";
import { ADMIN_HEADERS } from "./sync.types";

type Matrix = string[][];
type Store = Record<string, Matrix>;

const HEADER = ["date", "case no", "company"];

function sourceRows(prefix: string, count = 2): Matrix {
  return [
    HEADER,
    ...Array.from({ length: count }, (_, index) => [
      `2026-07-${String(index + 1).padStart(2, "0")}`,
      `${prefix}-${index + 1}`,
      `${prefix} Co ${index + 1}`,
    ]),
  ];
}

function row(sourceSheet: string, caseNo: string): string[] {
  return ["", caseNo, sourceSheet, "", "", "", "", "", "", "", "", "", "", "", sourceSheet, "2", `${sourceSheet}::${caseNo}`, "t"];
}

function adminRows(store: Store): Matrix {
  return store.ADMIN.slice(1).filter((r) => r.some((c) => c.trim()));
}

function countSource(store: Store, sourceSheet: string): number {
  return adminRows(store).filter((r) => r[14] === sourceSheet).length;
}

function duplicateRecordIds(store: Store): number {
  const ids = adminRows(store).map((r) => r[16]).filter(Boolean);
  return ids.length - new Set(ids).size;
}

async function setup(failTabs: string[] = []) {
  vi.resetModules();
  process.env.NODE_ENV = "test";
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = "service@example.test";
  process.env.GOOGLE_PRIVATE_KEY = "private-key";
  process.env.GOOGLE_SOURCE_SPREADSHEET_ID = "source";
  process.env.GOOGLE_TARGET_SPREADSHEET_ID = "target";
  process.env.GOOGLE_TARGET_ADMIN_SHEET = "ADMIN";

  const { GoogleSheetsError } = await import("../../integrations/google-sheets/google-sheets.errors");
  const store: Store = {
    ADMIN: [ADMIN_HEADERS.slice(), row("พี่คิม", "K-1")],
    "พี่คิม": sourceRows("K"),
    "แอม": sourceRows("A"),
    "พี่วี": sourceRows("V"),
    "พี่วิ": sourceRows("VI"),
    "พี่แอน": sourceRows("N"),
  };

  vi.doMock("../../integrations/google-sheets/google-sheets.client", () => ({
    googleSheetsClient: {
      getMetadata: vi.fn(async (spreadsheetId: string) => ({
        spreadsheetId,
        title: spreadsheetId,
        sheets: Object.keys(store).map((title, sheetId) => ({ title, sheetId, rowCount: 10, columnCount: 20 })),
      })),
      getValues: vi.fn(async (_spreadsheetId: string, range: string) => {
        const match = range.match(/^'(.+)'!/);
        const sheet = match?.[1] ?? "";
        if (failTabs.includes(sheet) || !store[sheet]) {
          throw new GoogleSheetsError("GOOGLE_SHEET_TAB_NOT_FOUND", `missing ${sheet}`);
        }
        return store[sheet].map((r) => r.slice());
      }),
      clearValues: vi.fn(async (_spreadsheetId: string, range: string) => {
        const match = range.match(/^'(.+)'!/);
        const sheet = match?.[1] ?? "";
        store[sheet] = [];
      }),
      updateValues: vi.fn(async (_spreadsheetId: string, range: string, values: Matrix) => {
        const match = range.match(/^'(.+)'!/);
        const sheet = match?.[1] ?? "";
        store[sheet] = values.map((r) => r.slice());
      }),
    },
  }));

  const { syncService } = await import("./sync.service");
  return { syncService, store };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("syncService admin sources", () => {
  it("sync แอมไม่ลบพี่คิม", async () => {
    const { syncService, store } = await setup();
    await syncService.syncAdminSource("am");
    expect(countSource(store, "พี่คิม")).toBe(1);
    expect(countSource(store, "แอม")).toBe(2);
  });

  it("sync พี่วีไม่ลบแอม", async () => {
    const { syncService, store } = await setup();
    await syncService.syncAdminSource("am");
    await syncService.syncAdminSource("p-vee");
    expect(countSource(store, "แอม")).toBe(2);
    expect(countSource(store, "พี่วี")).toBe(2);
  });

  it("sync พี่แอนไม่ลบ source อื่น", async () => {
    const { syncService, store } = await setup();
    await syncService.syncAdminSource("am");
    await syncService.syncAdminSource("p-vee");
    await syncService.syncAdminSource("p-ann");
    expect(countSource(store, "แอม")).toBe(2);
    expect(countSource(store, "พี่วี")).toBe(2);
    expect(countSource(store, "พี่แอน")).toBe(2);
  });

  it("sync all รวมครบทุก source และรอบสองไม่เพิ่มซ้ำ", async () => {
    const { syncService, store } = await setup();
    await syncService.syncAdminAll();
    const firstCount = adminRows(store).length;
    await syncService.syncAdminAll();
    expect(adminRows(store)).toHaveLength(firstCount);
    expect(countSource(store, "พี่คิม")).toBe(2);
    expect(countSource(store, "แอม")).toBe(2);
    expect(countSource(store, "พี่วี")).toBe(2);
    expect(countSource(store, "พี่แอน")).toBe(2);
    expect(duplicateRecordIds(store)).toBe(0);
  });

  it("source ใดไม่พบต้องคืน error ที่ชัดเจน", async () => {
    const { syncService } = await setup(["แอม"]);
    await expect(syncService.syncAdminSource("am")).rejects.toMatchObject({
      code: "GOOGLE_SHEET_TAB_NOT_FOUND",
    });
  });

  it("sync all รายงาน partial failure แยกราย source", async () => {
    const { syncService, store } = await setup(["พี่แอน"]);
    const result = await syncService.syncAdminAll();
    expect(result.success).toBe(false);
    expect(result.results.some((r) => !r.success && r.slug === "p-ann")).toBe(true);
    expect(countSource(store, "พี่คิม")).toBe(2);
    expect(countSource(store, "แอม")).toBe(2);
    expect(countSource(store, "พี่วี")).toBe(2);
  });
});
