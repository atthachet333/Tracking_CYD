/* ============================================================
   Sheets API — endpoint /api/sheets/*
   ============================================================ */
import { httpGet, httpPost, toQuery } from "./api-client";
import type { SheetStatus, SheetMetadata, SheetHeadersResult, SheetRowsResult, SheetSummary, SyncAllResult, SyncResult } from "@/types";

export interface SheetRowsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const sheetsApi = {
  status: () => httpGet<SheetStatus>("/sheets/status"),
  metadata: () => httpGet<SheetMetadata>("/sheets/metadata"),
  headers: () => httpGet<SheetHeadersResult>("/sheets/headers"),
  rows: (p: SheetRowsParams = {}) =>
    httpGet<SheetRowsResult>(
      `/sheets/rows${toQuery({ page: p.page, pageSize: p.pageSize, search: p.search, sortBy: p.sortBy, sortOrder: p.sortOrder })}`,
    ),
  refresh: () => httpPost<SheetStatus>("/sheets/refresh"),
  /** สรุปยอดจาก Sheet 2 (คำนวณอย่างเดียว ไม่เขียนกลับ) */
  summary: () => httpGet<SheetSummary>("/sheets/summary"),
  /** คำนวณ + เขียนตารางสรุปลงแท็บ SUMMARY ของ Sheet 1 */
  rebuildSummary: () => httpPost<SheetSummary>("/sheets/summary/rebuild"),
  /** sync แท็บ "พี่คิม" ต้นทาง → แท็บ ADMIN ปลายทาง */
  syncAdminPKim: () => httpPost<SyncResult>("/sync/admin/p-kim"),
  syncAdmin: (slug: string) => httpPost<SyncResult>(`/sync/admin/${slug}`),
  syncAdminAll: () => httpPost<SyncAllResult>("/sync/admin/all"),
};

/** สร้าง URL เปิด Google Sheet จาก spreadsheetId (ไม่ใช่ข้อมูลลับ); ระบุ gid เพื่อเปิดตรงแท็บ */
export function googleSheetUrl(spreadsheetId: string | null, gid?: number | null): string | null {
  if (!spreadsheetId) return null;
  const base = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  return gid == null ? base : `${base}?gid=${gid}#gid=${gid}`;
}

/** Spreadsheet ID ของ Sheet 1 (ปลายทาง "ข้อมูลเว็บรวม Admin&เอกสาร") — fallback เมื่อ status ยังไม่โหลด */
export const SHEET1_SPREADSHEET_ID = "1-w8ptKcra1t4V-IgT6q3rQf-QYq1-glz_EGv4O88ltw";
export const SHEET1_GID = 0;

/**
 * URL ของ Sheet 1 พร้อม gid=0 เสมอ (ปุ่ม "เปิด Google Sheet" ทุกที่ควรชี้มาที่นี่)
 * ใช้ target id จาก status ถ้ามี ไม่งั้น fallback เป็นค่าคงที่ของ Sheet 1
 */
export function sheet1Url(targetSpreadsheetId?: string | null): string {
  return googleSheetUrl(targetSpreadsheetId || SHEET1_SPREADSHEET_ID, SHEET1_GID) as string;
}

/** mask spreadsheetId เพื่อแสดงบางส่วน */
export function maskId(id: string | null): string {
  if (!id) return "—";
  if (id.length <= 10) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}
