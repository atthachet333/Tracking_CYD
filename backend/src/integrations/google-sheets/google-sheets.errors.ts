/* ============================================================
   Google Sheets error types + error code mapping
   ============================================================ */

export type GoogleSheetsErrorCode =
  | "GOOGLE_SHEETS_NOT_CONFIGURED"
  | "GOOGLE_SHEETS_PERMISSION_DENIED"
  | "GOOGLE_SHEETS_NOT_FOUND"
  | "GOOGLE_SHEET_TAB_NOT_FOUND"
  | "GOOGLE_SHEETS_RATE_LIMITED"
  | "GOOGLE_SHEETS_INVALID_DATA"
  | "GOOGLE_SHEETS_CONNECTION_FAILED"
  | "SHEET_SYNC_FAILED"
  | "SYNC_IN_PROGRESS";

const STATUS_BY_CODE: Record<GoogleSheetsErrorCode, number> = {
  GOOGLE_SHEETS_NOT_CONFIGURED: 503,
  GOOGLE_SHEETS_PERMISSION_DENIED: 403,
  GOOGLE_SHEETS_NOT_FOUND: 404,
  GOOGLE_SHEET_TAB_NOT_FOUND: 404,
  GOOGLE_SHEETS_RATE_LIMITED: 429,
  GOOGLE_SHEETS_INVALID_DATA: 422,
  GOOGLE_SHEETS_CONNECTION_FAILED: 502,
  SHEET_SYNC_FAILED: 500,
  SYNC_IN_PROGRESS: 409,
};

export class GoogleSheetsError extends Error {
  readonly code: GoogleSheetsErrorCode;
  readonly statusCode: number;
  readonly details: unknown[];
  readonly retryable: boolean;

  constructor(code: GoogleSheetsErrorCode, message: string, details: unknown[] = []) {
    super(message);
    this.name = "GoogleSheetsError";
    this.code = code;
    this.statusCode = STATUS_BY_CODE[code];
    this.details = details;
    this.retryable =
      code === "GOOGLE_SHEETS_RATE_LIMITED" || code === "GOOGLE_SHEETS_CONNECTION_FAILED";
  }
}

/** แปลง error จาก googleapis เป็น GoogleSheetsError ที่มี code ชัดเจน */
export function mapGoogleApiError(err: unknown): GoogleSheetsError {
  const anyErr = err as { code?: number | string; response?: { status?: number }; message?: string };
  const status = Number(anyErr?.response?.status ?? anyErr?.code);
  const message = anyErr?.message ?? "Google Sheets request failed";

  switch (status) {
    case 401:
    case 403:
      return new GoogleSheetsError("GOOGLE_SHEETS_PERMISSION_DENIED", "ไม่มีสิทธิ์เข้าถึง Google Sheet — ตรวจสอบว่าแชร์ให้ Service Account แล้ว (Viewer)");
    case 404:
      return new GoogleSheetsError("GOOGLE_SHEETS_NOT_FOUND", "ไม่พบ Spreadsheet ตาม ID ที่กำหนด");
    case 429:
      return new GoogleSheetsError("GOOGLE_SHEETS_RATE_LIMITED", "ถูกจำกัดอัตราการเรียก Google Sheets API ชั่วคราว");
    default:
      return new GoogleSheetsError("GOOGLE_SHEETS_CONNECTION_FAILED", `เชื่อมต่อ Google Sheets ไม่สำเร็จ: ${message}`);
  }
}
