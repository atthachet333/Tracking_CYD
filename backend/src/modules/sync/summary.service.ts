/* ============================================================
   Summary Service
   - ดึงข้อมูลจาก Sheet 2 (ต้นทาง) ทุก source → map → สรุปยอด (buildSummary)
   - โหมด write: เขียนตารางสรุปลงแท็บ SUMMARY ของ Sheet 1 (ปลายทาง)
   - ทนต่อ source ที่ล่มบางตัว (รายงานใน sources[] แต่ยังสรุปตัวที่เหลือได้)
   ============================================================ */
import type { SheetSummary, SummarySource } from "@tracking-cyd/shared";
import { env, isGoogleConfigured, sourceSpreadsheetId, targetSpreadsheetId } from "../../config/env";
import { googleSheetsClient } from "../../integrations/google-sheets/google-sheets.client";
import { GoogleSheetsError } from "../../integrations/google-sheets/google-sheets.errors";
import { mapSourceToAdmin } from "./admin-sheet.mapper";
import { ADMIN_SYNC_SOURCES, type AdminSyncSource } from "./admin-sources";
import { buildSummary, buildSummaryMatrix, type SourceRows } from "./summary.mapper";

let lastSummary: SheetSummary | null = null;
let building = false;

function assertConfigured(): void {
  if (!isGoogleConfigured()) {
    throw new GoogleSheetsError("GOOGLE_SHEETS_NOT_CONFIGURED", "ยังไม่ได้ตั้งค่า Google Sheets (credential/source/target)");
  }
}

/** อ่านค่าจากแท็บต้นทาง (ลองทุกชื่อ alias ใน source.tabs) */
async function readSourceValues(source: AdminSyncSource): Promise<string[][]> {
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

async function collect(generatedAt: string): Promise<{ rows: SourceRows[]; sources: SummarySource[] }> {
  const rows: SourceRows[] = [];
  const sources: SummarySource[] = [];

  for (const source of ADMIN_SYNC_SOURCES) {
    try {
      const values = await readSourceValues(source);
      const mapped = mapSourceToAdmin(values, source.sheet, source.assignee, generatedAt);
      rows.push({ slug: source.slug, sourceSheet: source.sheet, rows: mapped.adminRows });
      sources.push({ slug: source.slug, sourceSheet: source.sheet, ok: true, rowsRead: mapped.rowsRead });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      sources.push({ slug: source.slug, sourceSheet: source.sheet, ok: false, rowsRead: 0, error: message });
    }
  }

  return { rows, sources };
}

export const summaryService = {
  /**
   * คำนวณสรุปยอดจาก Sheet 2
   * @param write true = เขียนผลลง SUMMARY tab ของ Sheet 1 ด้วย
   */
  async getSummary(write = false): Promise<SheetSummary> {
    assertConfigured();
    if (write && building) {
      throw new GoogleSheetsError("SYNC_IN_PROGRESS", "กำลังสร้างสรุปอยู่");
    }
    if (write) building = true;
    try {
      const generatedAt = new Date().toISOString();
      const { rows, sources } = await collect(generatedAt);
      const summary = buildSummary(rows, generatedAt);
      summary.sources = sources;

      if (write) {
        const sheet = env.GOOGLE_TARGET_SUMMARY_SHEET;
        await googleSheetsClient.ensureSheet(targetSpreadsheetId(), sheet);
        await googleSheetsClient.clearValues(targetSpreadsheetId(), `'${sheet}'!A:Z`);
        await googleSheetsClient.updateValues(targetSpreadsheetId(), `'${sheet}'!A1`, buildSummaryMatrix(summary));
        summary.written = true;
        summary.targetSheet = sheet;
      }

      lastSummary = summary;
      return summary;
    } finally {
      if (write) building = false;
    }
  },

  getLastSummary(): SheetSummary | null {
    return lastSummary;
  },
};
