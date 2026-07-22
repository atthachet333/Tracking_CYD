/* ============================================================
   Google Sheets Service (Integration orchestration)
   - resolve sheet title จาก GID ก่อนอ่าน (ห้ามสมมุติชื่อ Sheet)
   - อ่านค่า → map → cache
   - เปิดเผยสถานะ sync (lastSyncAt, rowCount, cacheHit)
   ============================================================ */
import type {
  SheetMetadata, SheetStatus, SheetHeadersResult, SheetRowsResult, CaseRow,
} from "@tracking-cyd/shared";
import { env, isGoogleConfigured, legacySpreadsheetId } from "../../config/env";
import { googleSheetsClient } from "./google-sheets.client";
import { TtlCache } from "./google-sheets.cache";
import { mapRowsToCases } from "./google-sheets.mapper";
import { GoogleSheetsError, mapGoogleApiError } from "./google-sheets.errors";
import type { MappedCases } from "./google-sheets.types";

const CACHE_KEY = "cases";
const cache = new TtlCache(env.GOOGLE_SHEETS_CACHE_TTL_SECONDS);

let lastSyncAt: string | null = null;
/** last-known-good snapshot — ใช้เสิร์ฟต่อเมื่อ Google API ล่ม/ช้า (กันจอเด้งเป็น empty/disconnected) */
let lastGood: MappedCases | null = null;
let lastError: GoogleSheetsError | null = null;
let revalidating = false;

async function loadFromSheet(): Promise<MappedCases> {
  const metadata = await googleSheetsClient.getMetadata(legacySpreadsheetId());
  const tab = metadata.sheets.find((s) => s.sheetId === env.GOOGLE_SHEETS_DEFAULT_GID);
  if (!tab) {
    throw new GoogleSheetsError(
      "GOOGLE_SHEET_TAB_NOT_FOUND",
      `ไม่พบ Sheet ที่มี GID=${env.GOOGLE_SHEETS_DEFAULT_GID} ใน Spreadsheet`,
    );
  }

  const range = `'${tab.title}'!${env.GOOGLE_SHEETS_DEFAULT_RANGE}`;
  const values = await googleSheetsClient.getValues(legacySpreadsheetId(), range);

  const headers = (values[0] ?? []).map((h) => h.trim());
  const dataRows = values.slice(1);
  const { cases, warnings, mapping, unmapped } = mapRowsToCases(headers, dataRows);

  lastSyncAt = new Date().toISOString();
  const result: MappedCases = { sheetTitle: tab.title, sheetId: tab.sheetId, headers, cases, warnings, mapping, unmapped };
  lastGood = result;
  lastError = null;
  return result;
}

/** refresh เบื้องหลัง (ไม่ block คำขอปัจจุบัน) — ใช้ตอนเสิร์ฟ stale cache */
function revalidateInBackground(): void {
  if (revalidating) return;
  revalidating = true;
  cache
    .dedupe(CACHE_KEY, loadFromSheet)
    .then((data) => cache.set(CACHE_KEY, data))
    .catch((err) => {
      lastError = err instanceof GoogleSheetsError ? err : mapGoogleApiError(err);
    })
    .finally(() => {
      revalidating = false;
    });
}

/**
 * โหลด (ใช้ cache); force=true จะข้าม cache แต่ยังกัน concurrent ด้วย single-flight
 * Stability: stale-while-revalidate + last-known-good fallback
 *   - cache สด → คืนทันที
 *   - cache หมดอายุแต่มี last-good → คืน stale ทันที + refresh เบื้องหลัง
 *   - โหลดจริงล้มเหลว (ไม่ force) แต่มี last-good → คืน stale แทน throw
 */
async function getMapped(force = false): Promise<{ data: MappedCases; cacheHit: boolean; stale: boolean }> {
  if (!isGoogleConfigured()) {
    throw new GoogleSheetsError("GOOGLE_SHEETS_NOT_CONFIGURED", "ยังไม่ได้ตั้งค่า Google Sheets credentials");
  }
  if (!force) {
    const cached = cache.get<MappedCases>(CACHE_KEY);
    if (cached.hit) return { data: cached.value, cacheHit: true, stale: false };
    if (lastGood) {
      revalidateInBackground();
      return { data: lastGood, cacheHit: true, stale: true };
    }
  }
  try {
    const data = await cache.dedupe(CACHE_KEY, loadFromSheet);
    cache.set(CACHE_KEY, data);
    return { data, cacheHit: false, stale: false };
  } catch (err) {
    const mapped = err instanceof GoogleSheetsError ? err : mapGoogleApiError(err);
    lastError = mapped;
    // ไม่ force → เสิร์ฟ last-good แทนที่จะพังทั้งหน้า; force (กด Refresh) → โยน error ให้ผู้ใช้เห็น
    if (!force && lastGood) return { data: lastGood, cacheHit: true, stale: true };
    throw mapped;
  }
}

function applyQuery(cases: CaseRow[], q: { search?: string; sortBy?: string; sortOrder?: "asc" | "desc"; page: number; pageSize: number }) {
  let rows = cases;
  if (q.search) {
    const s = q.search.toLowerCase();
    rows = rows.filter((c) =>
      [c.caseNo, c.customerName, c.assignee, c.department, c.serviceType, c.status].some((v) => v.toLowerCase().includes(s)),
    );
  }
  if (q.sortBy) {
    const key = q.sortBy as keyof CaseRow;
    const dir = q.sortOrder === "desc" ? -1 : 1;
    rows = [...rows].sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av ?? "").localeCompare(String(bv ?? "")) * dir;
    });
  }
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / q.pageSize));
  const page = Math.min(Math.max(1, q.page), totalPages);
  const data = rows.slice((page - 1) * q.pageSize, page * q.pageSize);
  return { data, pagination: { page, pageSize: q.pageSize, total, totalPages } };
}

export const googleSheetsService = {
  isConfigured: isGoogleConfigured,

  /** คืนสถานะการเชื่อมต่อ (ไม่ throw แม้ยังไม่ตั้งค่า) */
  async getStatus(): Promise<SheetStatus> {
    const base: SheetStatus = {
      configured: isGoogleConfigured(),
      connected: false,
      spreadsheetId: legacySpreadsheetId() || null,
      sheetId: env.GOOGLE_SHEETS_DEFAULT_GID,
      sheetTitle: null,
      lastSyncAt,
      rowCount: 0,
      warnings: [],
    };
    if (!isGoogleConfigured()) return base;
    try {
      const { data, cacheHit, stale } = await getMapped();
      const warnings = data.warnings.map((w) => w.message);
      if (stale) warnings.unshift(`กำลังแสดงข้อมูลสำรอง (ซิงก์ล่าสุด ${lastSyncAt ?? "—"})${lastError ? ` — ${lastError.message}` : ""}`);
      return {
        ...base,
        connected: true,
        sheetTitle: data.sheetTitle,
        rowCount: data.cases.length,
        lastSyncAt,
        cacheHit,
        stale,
        warnings,
      };
    } catch {
      return base;
    }
  },

  async getMetadata(): Promise<SheetMetadata> {
    if (!isGoogleConfigured()) {
      throw new GoogleSheetsError("GOOGLE_SHEETS_NOT_CONFIGURED", "ยังไม่ได้ตั้งค่า Google Sheets credentials");
    }
    return googleSheetsClient.getMetadata(legacySpreadsheetId());
  },

  async getHeaders(): Promise<SheetHeadersResult> {
    const { data } = await getMapped();
    return { headers: data.headers, mapping: data.mapping, unmapped: data.unmapped, warnings: data.warnings };
  },

  async getRows(q: { search?: string; sortBy?: string; sortOrder?: "asc" | "desc"; page: number; pageSize: number }): Promise<SheetRowsResult> {
    const { data } = await getMapped();
    const { data: rows, pagination } = applyQuery(data.cases, q);
    return { data: rows, pagination, meta: { source: "google-sheets", sheetTitle: data.sheetTitle, lastSyncAt, warnings: data.warnings } };
  },

  /** cases ทั้งหมด (ใช้โดย dashboard/entity services) — คืน [] เมื่อยังไม่ตั้งค่า */
  async getAllCases(): Promise<CaseRow[]> {
    if (!isGoogleConfigured()) return [];
    const { data } = await getMapped();
    return data.cases;
  },

  /** ล้าง cache แล้วอ่านใหม่ */
  async refresh(): Promise<SheetStatus> {
    if (!isGoogleConfigured()) {
      throw new GoogleSheetsError("GOOGLE_SHEETS_NOT_CONFIGURED", "ยังไม่ได้ตั้งค่า Google Sheets credentials");
    }
    cache.invalidate(CACHE_KEY);
    await getMapped(true);
    return this.getStatus();
  },

  getLastSyncAt(): string | null {
    return lastSyncAt;
  },
};
