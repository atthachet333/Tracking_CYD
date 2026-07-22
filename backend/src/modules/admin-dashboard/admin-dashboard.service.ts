/* ============================================================
   Admin Dashboard Service — อ่านแท็บ ADMIN (ปลายทาง gid 0) จริง
   - cache TTL + refresh
   - map → CustomerCaseItem (โครงสร้างเดียวกับ customer-dashboard)
   ============================================================ */
import type { CustomerCaseItem, CustomerDashboardMeta } from "@tracking-cyd/shared";
import { env, isGoogleConfigured, targetSpreadsheetId } from "../../config/env";
import { googleSheetsClient } from "../../integrations/google-sheets/google-sheets.client";
import { GoogleSheetsError } from "../../integrations/google-sheets/google-sheets.errors";
import { TtlCache } from "../../integrations/google-sheets/google-sheets.cache";
import { mapAdmin } from "./admin-dashboard.mapper";

const CACHE_KEY = "admin-dashboard";
const cache = new TtlCache(env.CUSTOMER_DASHBOARD_CACHE_TTL_SECONDS);

export interface AdminDataset {
  cases: CustomerCaseItem[];
  headers: string[];
  rowsRead: number;
  warnings: string[];
  generatedAt: string;
}

function assertConfigured(): void {
  if (!isGoogleConfigured()) {
    throw new GoogleSheetsError("GOOGLE_SHEETS_NOT_CONFIGURED", "ยังไม่ได้ตั้งค่า Google Sheets (credential/target)");
  }
}
function maskId(id: string | null): string | null {
  if (!id) return null;
  return id.length <= 10 ? id : `${id.slice(0, 6)}…${id.slice(-4)}`;
}

async function loadDataset(): Promise<AdminDataset> {
  const generatedAt = new Date().toISOString();
  const sheetTitle = env.GOOGLE_TARGET_ADMIN_SHEET;
  const values = await googleSheetsClient.getValues(targetSpreadsheetId(), `'${sheetTitle}'!A:ZZ`);
  const result = mapAdmin(values, sheetTitle);
  return { cases: result.cases, headers: result.headers, rowsRead: result.rowsRead, warnings: result.warnings, generatedAt };
}

async function getDataset(force = false): Promise<{ dataset: AdminDataset; cacheHit: boolean }> {
  assertConfigured();
  if (!force) {
    const cached = cache.get<AdminDataset>(CACHE_KEY);
    if (cached.hit) return { dataset: cached.value, cacheHit: true };
  }
  const dataset = await cache.dedupe(CACHE_KEY, loadDataset);
  cache.set(CACHE_KEY, dataset);
  return { dataset, cacheHit: false };
}

function buildMeta(dataset: AdminDataset, cacheHit: boolean): CustomerDashboardMeta {
  return {
    source: "google-sheets",
    spreadsheetId: maskId(targetSpreadsheetId() || null),
    sheetId: 0,
    sheetTitle: env.GOOGLE_TARGET_ADMIN_SHEET,
    statusHeader: "สถานะลูกค้า",
    tabsAggregated: [env.GOOGLE_TARGET_ADMIN_SHEET],
    rowsRead: dataset.rowsRead,
    lastUpdatedAt: dataset.generatedAt,
    cacheHit,
    warnings: dataset.warnings,
  };
}

export const adminDashboardService = { getDataset, buildMeta };
