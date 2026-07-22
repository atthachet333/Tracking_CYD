/* ============================================================
   Customer Dashboard Service (orchestration)
   - อ่านสถานะลูกค้าจากชีตต้นทางจริง (แท็บผู้รับผิดชอบ = แหล่งเดียวกับ Admin Sync)
   - resolve แท็บ gid ที่ตั้งค่าไว้ผ่าน metadata (traceability) + เตือนถ้าไม่มีคอลัมน์สถานะ
   - cache TTL + refresh (ใช้ TtlCache เดิม)
   - ไม่ส่ง credential ออก (mask spreadsheetId)
   ============================================================ */
import type { CustomerDashboardMeta } from "@tracking-cyd/shared";
import { env, isGoogleConfigured, sourceSpreadsheetId } from "../../config/env";
import { googleSheetsClient } from "../../integrations/google-sheets/google-sheets.client";
import { GoogleSheetsError } from "../../integrations/google-sheets/google-sheets.errors";
import { TtlCache } from "../../integrations/google-sheets/google-sheets.cache";
import { ADMIN_SYNC_SOURCES, type AdminSyncSource } from "../sync/admin-sources";
import { mapSourceToCustomerCases, hasCustomerStatusColumn } from "./customer-dashboard.mapper";
import type { CustomerDataset } from "./customer-dashboard.types";

const CACHE_KEY = "customer-dashboard";
const cache = new TtlCache(env.CUSTOMER_DASHBOARD_CACHE_TTL_SECONDS);

function assertConfigured(): void {
  if (!isGoogleConfigured()) {
    throw new GoogleSheetsError("GOOGLE_SHEETS_NOT_CONFIGURED", "ยังไม่ได้ตั้งค่า Google Sheets (credential/source/target)");
  }
}

function maskId(id: string | null): string | null {
  if (!id) return null;
  if (id.length <= 10) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

/** อ่านค่าแท็บต้นทางของ source (ลองทุก alias) — คืน null ถ้าไม่พบ */
async function readSourceValues(source: AdminSyncSource): Promise<{ tab: string; values: string[][] } | null> {
  for (const tab of source.tabs) {
    try {
      const values = await googleSheetsClient.getValues(sourceSpreadsheetId(), `'${tab}'!A:ZZ`);
      return { tab, values };
    } catch (err) {
      if (!(err instanceof GoogleSheetsError)) throw err;
      // ลอง alias ถัดไป
    }
  }
  return null;
}

async function loadDataset(): Promise<CustomerDataset> {
  const generatedAt = new Date().toISOString();
  const warnings: string[] = [];
  const tabsAggregated: string[] = [];
  const unknown = new Set<string>();
  const cases: CustomerDataset["cases"] = [];
  let rowsRead = 0;

  // metadata: resolve ชื่อแท็บของ gid ที่ตั้งค่าไว้ (traceability)
  let configuredTabTitle: string | null = null;
  try {
    const meta = await googleSheetsClient.getMetadata(sourceSpreadsheetId());
    configuredTabTitle = meta.sheets.find((s) => s.sheetId === env.CUSTOMER_DASHBOARD_SOURCE_GID)?.title ?? null;
  } catch {
    // metadata อ่านไม่ได้ ไม่ถือว่า fatal (ยังลองอ่านแท็บต่อได้)
  }

  // ตรวจว่าแท็บ gid ที่ตั้งค่ามีคอลัมน์สถานะหรือไม่ (โปร่งใส)
  if (configuredTabTitle) {
    try {
      const cfgValues = await googleSheetsClient.getValues(sourceSpreadsheetId(), `'${configuredTabTitle}'!A:ZZ`);
      if (!hasCustomerStatusColumn(cfgValues)) {
        warnings.push(
          `แท็บ gid=${env.CUSTOMER_DASHBOARD_SOURCE_GID} ("${configuredTabTitle}") ไม่มีคอลัมน์ "${env.CUSTOMER_DASHBOARD_STATUS_HEADER}" — ระบบรวมสถานะจากแท็บผู้รับผิดชอบที่มี header จริงแทน`,
        );
      }
    } catch {
      /* ไม่ critical */
    }
  }

  for (const source of ADMIN_SYNC_SOURCES) {
    const read = await readSourceValues(source);
    if (!read) {
      warnings.push(`ไม่พบแท็บต้นทางของ ${source.sheet} (${source.tabs.join(", ")})`);
      continue;
    }
    try {
      const result = mapSourceToCustomerCases(read.values, source.sheet, source.assignee, generatedAt);
      tabsAggregated.push(read.tab);
      rowsRead += result.rowsRead;
      cases.push(...result.cases);
      result.unknownStatuses.forEach((s) => unknown.add(s));
      if (!result.hasStatusColumn) {
        warnings.push(`แท็บ "${read.tab}" ไม่มีคอลัมน์ "${env.CUSTOMER_DASHBOARD_STATUS_HEADER}" — นับเป็น "ยังไม่ระบุสถานะ"`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      warnings.push(`อ่านแท็บ "${read.tab}" ไม่สำเร็จ: ${message}`);
    }
  }

  if (unknown.size > 0) {
    warnings.push(`พบค่าสถานะที่ยังไม่รู้จัก ${unknown.size} ค่า: ${[...unknown].join(", ")} — ถูกจัดเป็น "ยังไม่ระบุสถานะ"`);
  }

  return {
    cases,
    unknownStatuses: [...unknown],
    tabsAggregated,
    configuredTabTitle,
    rowsRead,
    warnings,
    generatedAt,
  };
}

async function getDataset(force = false): Promise<{ dataset: CustomerDataset; cacheHit: boolean }> {
  assertConfigured();
  if (!force) {
    const cached = cache.get<CustomerDataset>(CACHE_KEY);
    if (cached.hit) return { dataset: cached.value, cacheHit: true };
  }
  const dataset = await cache.dedupe(CACHE_KEY, loadDataset);
  cache.set(CACHE_KEY, dataset);
  return { dataset, cacheHit: false };
}

export function buildMeta(dataset: CustomerDataset, cacheHit: boolean): CustomerDashboardMeta {
  return {
    source: "google-sheets",
    spreadsheetId: maskId(sourceSpreadsheetId() || null),
    sheetId: env.CUSTOMER_DASHBOARD_SOURCE_GID,
    sheetTitle: dataset.configuredTabTitle,
    statusHeader: env.CUSTOMER_DASHBOARD_STATUS_HEADER,
    tabsAggregated: dataset.tabsAggregated,
    rowsRead: dataset.rowsRead,
    lastUpdatedAt: dataset.generatedAt,
    cacheHit,
    warnings: dataset.warnings,
  };
}

export const customerDashboardService = {
  getDataset,
  buildMeta,
};
