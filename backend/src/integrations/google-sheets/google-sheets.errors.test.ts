import { describe, it, expect } from "vitest";
import { mapGoogleApiError, GoogleSheetsError } from "./google-sheets.errors";

describe("mapGoogleApiError", () => {
  it("403 → PERMISSION_DENIED (ไม่ retry)", () => {
    const e = mapGoogleApiError({ response: { status: 403 } });
    expect(e).toBeInstanceOf(GoogleSheetsError);
    expect(e.code).toBe("GOOGLE_SHEETS_PERMISSION_DENIED");
    expect(e.statusCode).toBe(403);
    expect(e.retryable).toBe(false);
  });

  it("404 → NOT_FOUND", () => {
    expect(mapGoogleApiError({ code: 404 }).code).toBe("GOOGLE_SHEETS_NOT_FOUND");
  });

  it("429 → RATE_LIMITED (retry ได้)", () => {
    const e = mapGoogleApiError({ response: { status: 429 } });
    expect(e.code).toBe("GOOGLE_SHEETS_RATE_LIMITED");
    expect(e.retryable).toBe(true);
  });

  it("อื่น ๆ → CONNECTION_FAILED", () => {
    expect(mapGoogleApiError({ message: "network" }).code).toBe("GOOGLE_SHEETS_CONNECTION_FAILED");
  });
});
