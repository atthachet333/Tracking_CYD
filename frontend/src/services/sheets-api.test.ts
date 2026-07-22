import { describe, it, expect } from "vitest";
import { googleSheetUrl, maskId, sheet1Url, SHEET1_SPREADSHEET_ID } from "./sheets-api";
import { toQuery } from "./api-client";

describe("sheets-api helpers", () => {
  it("googleSheetUrl สร้าง URL จาก spreadsheetId", () => {
    expect(googleSheetUrl("abc123")).toBe("https://docs.google.com/spreadsheets/d/abc123/edit");
    expect(googleSheetUrl(null)).toBeNull();
  });

  it("googleSheetUrl แนบ gid เมื่อระบุ", () => {
    expect(googleSheetUrl("abc123", 0)).toBe("https://docs.google.com/spreadsheets/d/abc123/edit?gid=0#gid=0");
    expect(googleSheetUrl("abc123", 42)).toBe("https://docs.google.com/spreadsheets/d/abc123/edit?gid=42#gid=42");
  });

  it("sheet1Url ชี้ Sheet 1 พร้อม gid=0 เสมอ (fallback เมื่อไม่มี target id)", () => {
    expect(sheet1Url()).toBe(`https://docs.google.com/spreadsheets/d/${SHEET1_SPREADSHEET_ID}/edit?gid=0#gid=0`);
    expect(sheet1Url("target-xyz")).toBe("https://docs.google.com/spreadsheets/d/target-xyz/edit?gid=0#gid=0");
  });

  it("maskId ปิดบัง id บางส่วน", () => {
    expect(maskId(null)).toBe("—");
    expect(maskId("1-w8ptKcra1t4V-IgT6q3rQf")).toBe("1-w8pt…3rQf");
    expect(maskId("short")).toBe("short");
  });
});

describe("toQuery", () => {
  it("สร้าง query string และข้ามค่าว่าง", () => {
    expect(toQuery({ page: 1, pageSize: 50, search: "" })).toBe("?page=1&pageSize=50");
    expect(toQuery({})).toBe("");
  });
});
