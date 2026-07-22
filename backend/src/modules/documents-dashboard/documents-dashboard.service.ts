/* ============================================================
   Documents Dashboard Service (orchestration)
   - อ่านแท็บ DOCUMENTS จริงจากชีตปลายทาง (resolve ชื่อแท็บผ่าน metadata ตาม gid)
   - cache TTL + refresh (TtlCache เดิม) — อ่าน sheet ครั้งเดียวต่อ cache cycle
   - ไม่ส่ง credential (mask spreadsheetId)
   ============================================================ */
import type { DocumentsDashboardMeta } from "@tracking-cyd/shared";
import { env, isGoogleConfigured, targetSpreadsheetId } from "../../config/env";
import { googleSheetsClient } from "../../integrations/google-sheets/google-sheets.client";
import { GoogleSheetsError } from "../../integrations/google-sheets/google-sheets.errors";
import { TtlCache } from "../../integrations/google-sheets/google-sheets.cache";
import { mapDocuments, type DocMapResult } from "./documents-dashboard.mapper";
import type { DocumentsDataset } from "./documents-dashboard.types";

const CACHE_KEY = "documents-dashboard";
const cache = new TtlCache(env.DOCUMENTS_DASHBOARD_CACHE_TTL_SECONDS);

function assertConfigured(): void {
  if (!isGoogleConfigured()) {
    throw new GoogleSheetsError("GOOGLE_SHEETS_NOT_CONFIGURED", "ยังไม่ได้ตั้งค่า Google Sheets (credential/target)");
  }
}

function maskId(id: string | null): string | null {
  if (!id) return null;
  return id.length <= 10 ? id : `${id.slice(0, 6)}…${id.slice(-4)}`;
}

let lastMapping: DocMapResult["mapping"] = {};
let lastUnmapped: string[] = [];

async function loadDataset(): Promise<DocumentsDataset> {
  const generatedAt = new Date().toISOString();

  // resolve ชื่อแท็บจาก gid (ไม่สมมุติชื่อ)
  let sheetTitle = env.GOOGLE_TARGET_DOCUMENTS_SHEET;
  try {
    const meta = await googleSheetsClient.getMetadata(targetSpreadsheetId());
    const tab = meta.sheets.find((s) => s.sheetId === env.DOCUMENTS_DASHBOARD_GID);
    if (tab) sheetTitle = tab.title;
  } catch {
    /* ใช้ชื่อจาก env เป็น fallback */
  }

  const values = await googleSheetsClient.getValues(targetSpreadsheetId(), `'${sheetTitle}'!A:ZZ`);
  const result = mapDocuments(values, sheetTitle);
  lastMapping = result.mapping;
  lastUnmapped = result.unmapped;

  const headerRowIdx = values.findIndex((r) => r.some((c) => (c ?? "").toString().trim() !== ""));
  const preview = values.slice(Math.max(0, headerRowIdx + 1), Math.max(0, headerRowIdx + 1) + 8);

  return {
    items: result.items,
    headers: result.headers,
    statusHeader: result.statusHeader,
    unknownStatuses: result.unknownStatuses,
    rowsRead: result.rowsRead,
    warnings: result.warnings,
    generatedAt,
    preview,
  };
}

async function getDataset(force = false): Promise<{ dataset: DocumentsDataset; cacheHit: boolean }> {
  assertConfigured();
  if (!force) {
    const cached = cache.get<DocumentsDataset>(CACHE_KEY);
    if (cached.hit) return { dataset: cached.value, cacheHit: true };
  }
  const dataset = await cache.dedupe(CACHE_KEY, loadDataset);
  cache.set(CACHE_KEY, dataset);
  return { dataset, cacheHit: false };
}

function buildMeta(dataset: DocumentsDataset, cacheHit: boolean): DocumentsDashboardMeta {
  return {
    source: "google-sheets",
    spreadsheetId: maskId(targetSpreadsheetId() || null),
    sheetId: env.DOCUMENTS_DASHBOARD_GID,
    sheetTitle: env.GOOGLE_TARGET_DOCUMENTS_SHEET,
    statusHeader: dataset.statusHeader,
    headers: dataset.headers,
    rowsRead: dataset.rowsRead,
    lastUpdatedAt: dataset.generatedAt,
    cacheHit,
    warnings: dataset.warnings,
  };
}

export const documentsDashboardService = {
  getDataset,
  buildMeta,
  getMapping(): { mapping: DocMapResult["mapping"]; unmapped: string[] } {
    return { mapping: lastMapping, unmapped: lastUnmapped };
  },
};
