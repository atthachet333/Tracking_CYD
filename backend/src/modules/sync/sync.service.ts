import type { SheetStatus, SheetSideStatus, SyncAllResult, SyncResult } from "@tracking-cyd/shared";
import {
  env, isGoogleConfigured, sourceSpreadsheetId, targetSpreadsheetId,
} from "../../config/env";
import { googleSheetsClient } from "../../integrations/google-sheets/google-sheets.client";
import { GoogleSheetsError } from "../../integrations/google-sheets/google-sheets.errors";
import { mapSourceToAdmin, buildAdminMatrix } from "./admin-sheet.mapper";
import { ADMIN_SYNC_SOURCES, findAdminSyncSource, type AdminSyncSource } from "./admin-sources";

const syncingSources = new Set<string>();
let syncingAdmin = false;
let lastSyncAt: string | null = null;

async function sideStatus(spreadsheetId: string): Promise<SheetSideStatus> {
  const id = spreadsheetId || null;
  try {
    const meta = await googleSheetsClient.getMetadata(spreadsheetId);
    return { connected: true, spreadsheetId: id, spreadsheetTitle: meta.title, sheets: meta.sheets.map((s) => s.title) };
  } catch {
    return { connected: false, spreadsheetId: id, spreadsheetTitle: null, sheets: [] };
  }
}

function assertConfigured(): void {
  if (!isGoogleConfigured()) {
    throw new GoogleSheetsError("GOOGLE_SHEETS_NOT_CONFIGURED", "ยังไม่ได้ตั้งค่า Google Sheets (credential/source/target)");
  }
}

async function getSourceValues(source: AdminSyncSource): Promise<string[][]> {
  let lastError: GoogleSheetsError | null = null;
  for (const tab of source.tabs) {
    try {
      return await googleSheetsClient.getValues(sourceSpreadsheetId(), `'${tab}'!A:ZZ`);
    } catch (err) {
      if (!(err instanceof GoogleSheetsError)) throw err;
      lastError = err;
    }
  }
  throw new GoogleSheetsError(
    "GOOGLE_SHEET_TAB_NOT_FOUND",
    `ไม่พบแท็บต้นทางสำหรับ ${source.slug}: ${source.tabs.join(", ")}`,
    lastError ? [{ code: lastError.code }] : [],
  );
}

async function syncOneSource(source: AdminSyncSource, syncedAt = new Date().toISOString(), lockAdmin = true): Promise<SyncResult> {
  assertConfigured();
  if (syncingSources.has(source.slug)) {
    throw new GoogleSheetsError("SYNC_IN_PROGRESS", `source ${source.slug} กำลัง sync อยู่`);
  }
  // ponytail: global ADMIN write lock; queue per source if concurrent writes become required.
  if (lockAdmin && syncingAdmin) {
    throw new GoogleSheetsError("SYNC_IN_PROGRESS", "ADMIN sync กำลังทำงานอยู่");
  }

  syncingSources.add(source.slug);
  if (lockAdmin) syncingAdmin = true;
  try {
    const adminSheet = env.GOOGLE_TARGET_ADMIN_SHEET;
    const sourceValues = await getSourceValues(source);
    const mapResult = mapSourceToAdmin(sourceValues, source.sheet, source.assignee, syncedAt);
    const existingAdmin = await googleSheetsClient.getValues(targetSpreadsheetId(), `'${adminSheet}'!A:ZZ`);
    const matrix = buildAdminMatrix(existingAdmin, mapResult.adminRows, source.sheet);

    await googleSheetsClient.clearValues(targetSpreadsheetId(), `'${adminSheet}'!A:ZZ`);
    await googleSheetsClient.updateValues(targetSpreadsheetId(), `'${adminSheet}'!A1`, matrix);
    lastSyncAt = syncedAt;

    return {
      success: true,
      slug: source.slug,
      sourceSheet: source.sheet,
      targetSheet: adminSheet,
      rowsRead: mapResult.rowsRead,
      rowsWritten: mapResult.rowsWritten,
      emptyRowsSkipped: mapResult.emptyRowsSkipped,
      repeatedHeadersSkipped: mapResult.repeatedHeadersSkipped,
      invalidRowsSkipped: mapResult.invalidRowsSkipped,
      duplicateRows: mapResult.duplicateRows,
      syncedAt,
    };
  } catch (err) {
    if (err instanceof GoogleSheetsError) throw err;
    throw new GoogleSheetsError("SHEET_SYNC_FAILED", `sync ${source.slug} ไม่สำเร็จ: ${(err as Error).message}`);
  } finally {
    syncingSources.delete(source.slug);
    if (lockAdmin) syncingAdmin = false;
  }
}

export const syncService = {
  async getConnectionStatus(): Promise<SheetStatus> {
    const configured = isGoogleConfigured();
    if (!configured) {
      const empty: SheetSideStatus = { connected: false, spreadsheetId: null, spreadsheetTitle: null, sheets: [] };
      return {
        configured: false, connected: false, spreadsheetId: sourceSpreadsheetId() || null,
        sheetId: 0, sheetTitle: null, lastSyncAt, rowCount: 0, warnings: [],
        source: empty, target: empty,
      };
    }
    const [source, target] = await Promise.all([sideStatus(sourceSpreadsheetId()), sideStatus(targetSpreadsheetId())]);
    return {
      configured: true,
      connected: source.connected && target.connected,
      spreadsheetId: sourceSpreadsheetId() || null,
      sheetId: 0,
      sheetTitle: source.spreadsheetTitle,
      lastSyncAt,
      rowCount: 0,
      warnings: [],
      source,
      target,
    };
  },

  syncAdminPKim(): Promise<SyncResult> {
    return this.syncAdminSource("p-kim");
  },

  async syncAdminSource(slug: string): Promise<SyncResult> {
    const source = findAdminSyncSource(slug);
    if (!source) {
      throw new GoogleSheetsError("GOOGLE_SHEET_TAB_NOT_FOUND", `ไม่รู้จัก admin sync source: ${slug}`);
    }
    return syncOneSource(source);
  },

  async syncAdminAll(): Promise<SyncAllResult> {
    assertConfigured();
    if (syncingAdmin) {
      throw new GoogleSheetsError("SYNC_IN_PROGRESS", "ADMIN sync กำลังทำงานอยู่");
    }
    syncingAdmin = true;
    const syncedAt = new Date().toISOString();
    const results: SyncAllResult["results"] = [];

    try {
      for (const source of ADMIN_SYNC_SOURCES) {
        try {
          results.push(await syncOneSource(source, syncedAt, false));
        } catch (err) {
          const error = err instanceof GoogleSheetsError
            ? { code: err.code, message: err.message }
            : { code: "SHEET_SYNC_FAILED", message: (err as Error).message };
          results.push({ success: false, slug: source.slug, sourceSheet: source.sheet, error });
        }
      }

      if (results.some((result) => result.success)) lastSyncAt = syncedAt;
      return {
        success: results.every((result) => result.success),
        targetSheet: env.GOOGLE_TARGET_ADMIN_SHEET,
        syncedAt,
        results,
      };
    } finally {
      syncingAdmin = false;
    }
  },

  isSyncing(): boolean {
    return syncingAdmin || syncingSources.size > 0;
  },

  getLastSyncAt(): string | null {
    return lastSyncAt;
  },
};
