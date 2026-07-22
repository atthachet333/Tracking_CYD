/* ============================================================
   Customer Dashboard Mapper (pure)
   - ใช้ mapSourceToAdmin (dedup + header-detection เดียวกับ Admin Sync)
     แล้วแปลง ADMIN row → CustomerCaseItem + จำแนกกลุ่มสถานะ
   - หา "สถานะลูกค้า" จาก header จริง (ไม่ผูก column index ของชีตต้นทาง)
   ============================================================ */
import type { CustomerCaseItem } from "@tracking-cyd/shared";
import { ADMIN_HEADERS } from "../sync/sync.types";
import { mapSourceToAdmin } from "../sync/admin-sheet.mapper";
import { detectHeaderRow } from "../sync/header-detector";
import { classifyStatus, isUnknownStatus } from "./customer-status.config";

const IDX = {
  date: ADMIN_HEADERS.indexOf("วันที่"),
  caseNo: ADMIN_HEADERS.indexOf("รหัสเคส"),
  assignee: ADMIN_HEADERS.indexOf("ผู้รับผิดชอบ"),
  company: ADMIN_HEADERS.indexOf("ชื่อบริษัท"),
  initialDetail: ADMIN_HEADERS.indexOf("รายละเอียดเบื้องต้น"),
  quotation: ADMIN_HEADERS.indexOf("ทำใบเสนอราคา"),
  quotationLink: ADMIN_HEADERS.indexOf("ลิงก์ใบเสนอราคา"),
  follow1: ADMIN_HEADERS.indexOf("ติดตามรอบ 1"),
  follow2: ADMIN_HEADERS.indexOf("ติดตามรอบ 2"),
  follow3: ADMIN_HEADERS.indexOf("ติดตามรอบ 3"),
  customerStatus: ADMIN_HEADERS.indexOf("สถานะลูกค้า"),
  deposit: ADMIN_HEADERS.indexOf("มัดจำ"),
  contractDraft: ADMIN_HEADERS.indexOf("ร่างสัญญา"),
  contractLink: ADMIN_HEADERS.indexOf("ลิงก์สัญญา"),
  sourceSheet: ADMIN_HEADERS.indexOf("source_sheet"),
  sourceRow: ADMIN_HEADERS.indexOf("source_row"),
} as const;

function at(row: string[], idx: number): string {
  return idx < 0 ? "" : (row[idx] ?? "").toString().trim();
}

export interface SourceMapResult {
  cases: CustomerCaseItem[];
  unknownStatuses: string[];
  hasStatusColumn: boolean;
  rowsRead: number;
}

/** true ถ้าแท็บนี้มีคอลัมน์ "สถานะลูกค้า" ตาม header จริง */
export function hasCustomerStatusColumn(values: string[][]): boolean {
  const detected = detectHeaderRow(values);
  return Boolean(detected && detected.columnMap.customerStatus !== undefined);
}

/** map หนึ่งแท็บต้นทาง → เคสลูกค้า (จำแนกกลุ่มแล้ว) */
export function mapSourceToCustomerCases(
  values: string[][],
  sourceSheet: string,
  assignee: string,
  syncedAt: string,
): SourceMapResult {
  const hasStatusColumn = hasCustomerStatusColumn(values);
  const mapped = mapSourceToAdmin(values, sourceSheet, assignee, syncedAt);
  const unknown = new Set<string>();

  const cases: CustomerCaseItem[] = mapped.adminRows.map((row) => {
    const customerStatus = at(row, IDX.customerStatus);
    if (isUnknownStatus(customerStatus)) unknown.add(customerStatus);
    const followUp1 = at(row, IDX.follow1);
    const followUp2 = at(row, IDX.follow2);
    const followUp3 = at(row, IDX.follow3);
    const latestFollowUp = followUp3 || followUp2 || followUp1;
    return {
      date: at(row, IDX.date) || null,
      caseNo: at(row, IDX.caseNo),
      company: at(row, IDX.company),
      assignee: at(row, IDX.assignee) || assignee,
      initialDetail: at(row, IDX.initialDetail),
      quotation: at(row, IDX.quotation),
      quotationLink: at(row, IDX.quotationLink),
      followUp1,
      followUp2,
      followUp3,
      customerStatus,
      statusGroup: classifyStatus(customerStatus),
      deposit: at(row, IDX.deposit),
      contractDraft: at(row, IDX.contractDraft),
      contractLink: at(row, IDX.contractLink),
      latestFollowUp,
      sourceSheet: at(row, IDX.sourceSheet) || sourceSheet,
      sourceRow: Number(at(row, IDX.sourceRow)) || 0,
    };
  });

  return { cases, unknownStatuses: [...unknown], hasStatusColumn, rowsRead: mapped.rowsRead };
}
