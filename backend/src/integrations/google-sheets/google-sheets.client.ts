/* ============================================================
   Google Sheets API Client (googleapis, Service Account)
   - อ่าน/เขียนได้หลาย spreadsheet (รับ spreadsheetId เป็นพารามิเตอร์)
   - timeout + retry (exponential backoff) เฉพาะ error ที่ retry ได้
   - ไม่มี business logic
   ============================================================ */
import { google, type sheets_v4 } from "googleapis";
import { env, getPrivateKey, hasCredentials } from "../../config/env";
import { GoogleSheetsError, mapGoogleApiError } from "./google-sheets.errors";
import type { SheetMetadata } from "./google-sheets.types";

// อ่าน+เขียน (ต้องเขียนลงชีตปลายทาง)
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const MAX_RETRIES = 3;

let cachedClient: sheets_v4.Sheets | null = null;

function getClient(): sheets_v4.Sheets {
  if (!hasCredentials()) {
    throw new GoogleSheetsError("GOOGLE_SHEETS_NOT_CONFIGURED", "ยังไม่ได้ตั้งค่า Google Service Account credentials");
  }
  if (cachedClient) return cachedClient;

  const auth = new google.auth.JWT({
    email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: getPrivateKey(),
    scopes: SCOPES,
  });
  cachedClient = google.sheets({ version: "v4", auth, timeout: env.GOOGLE_SHEETS_TIMEOUT_MS });
  return cachedClient;
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastErr: GoogleSheetsError | null = null;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const mapped = err instanceof GoogleSheetsError ? err : mapGoogleApiError(err);
      lastErr = mapped;
      if (!mapped.retryable) throw mapped;
      await new Promise((r) => setTimeout(r, 300 * 2 ** attempt));
    }
  }
  throw lastErr ?? new GoogleSheetsError("GOOGLE_SHEETS_CONNECTION_FAILED", "เชื่อมต่อไม่สำเร็จ");
}

function toStringMatrix(values: unknown[][] | null | undefined): string[][] {
  return (values ?? []).map((row) => row.map((cell) => (cell === null || cell === undefined ? "" : String(cell))));
}

export const googleSheetsClient = {
  hasCredentials,

  /** metadata ของ spreadsheet (title + รายชื่อ sheet/tab) */
  async getMetadata(spreadsheetId: string): Promise<SheetMetadata> {
    const sheets = getClient();
    return withRetry(async () => {
      const res = await sheets.spreadsheets.get({
        spreadsheetId,
        fields: "spreadsheetId,properties.title,sheets.properties",
      });
      const data = res.data;
      return {
        spreadsheetId: data.spreadsheetId ?? spreadsheetId,
        title: data.properties?.title ?? "",
        sheets: (data.sheets ?? []).map((s) => ({
          sheetId: s.properties?.sheetId ?? 0,
          title: s.properties?.title ?? "",
          rowCount: s.properties?.gridProperties?.rowCount ?? 0,
          columnCount: s.properties?.gridProperties?.columnCount ?? 0,
        })),
      };
    });
  },

  /** อ่านค่าใน range (เช่น 'พี่คิม'!A:ZZ) */
  async getValues(spreadsheetId: string, range: string): Promise<string[][]> {
    const sheets = getClient();
    return withRetry(async () => {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
        valueRenderOption: "UNFORMATTED_VALUE",
        dateTimeRenderOption: "FORMATTED_STRING",
      });
      return toStringMatrix(res.data.values);
    });
  },

  /** เขียนทับค่าเริ่มที่ตำแหน่ง range (RAW) */
  async updateValues(spreadsheetId: string, range: string, values: string[][]): Promise<void> {
    const sheets = getClient();
    await withRetry(async () => {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: "RAW",
        requestBody: { values },
      });
    });
  },

  /** ล้างค่าใน range (ไม่ลบแท็บ) */
  async clearValues(spreadsheetId: string, range: string): Promise<void> {
    const sheets = getClient();
    await withRetry(async () => {
      await sheets.spreadsheets.values.clear({ spreadsheetId, range });
    });
  },

  /** สร้างแท็บถ้ายังไม่มี (idempotent) — ใช้ก่อนเขียนแท็บสรุป */
  async ensureSheet(spreadsheetId: string, title: string): Promise<void> {
    const meta = await this.getMetadata(spreadsheetId);
    if (meta.sheets.some((s) => s.title === title)) return;
    const sheets = getClient();
    await withRetry(async () => {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests: [{ addSheet: { properties: { title } } }] },
      });
    });
  },
};
