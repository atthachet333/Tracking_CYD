/* ============================================================
   Unified Tasks Adapter (pure) — แปลง Admin (customer cases) และ Documents
   ให้เป็น UnifiedTask รูปแบบเดียวกัน (พร้อม label ภาษาไทย)
   ============================================================ */
import type { CustomerCaseItem, DocumentTaskItem, UnifiedTask, UnifiedTaskLink } from "@tracking-cyd/shared";

function link(label: string, url: string): UnifiedTaskLink[] {
  return /^https?:\/\//i.test((url ?? "").trim()) ? [{ label, url: url.trim() }] : [];
}

export function adminToUnified(c: CustomerCaseItem): UnifiedTask {
  return {
    id: `admin-${c.sourceSheet}-${c.sourceRow}`,
    department: "admin",
    departmentLabel: "แอดมิน",
    workDate: c.date,
    caseNo: c.caseNo,
    companyName: c.company,
    assignee: c.assignee,
    detail: c.initialDetail,
    quotationStatus: c.quotation || null,
    paymentStatus: c.deposit || null, // admin ใช้ "มัดจำ" เป็นสถานะการชำระฝั่งแอดมิน (ถ้ามี)
    followUp1: c.followUp1 || null,
    followUp2: c.followUp2 || null,
    followUp3: c.followUp3 || null,
    customerStatus: c.customerStatus || null,
    actualStatus: c.customerStatus,
    statusGroup: c.statusGroup,
    latestFollowUp: c.latestFollowUp,
    links: [...link("ใบเสนอราคา", c.quotationLink), ...link("สัญญา", c.contractLink)],
    sourceSheet: c.sourceSheet,
    sourceRow: c.sourceRow,
  };
}

export function documentToUnified(d: DocumentTaskItem): UnifiedTask {
  return {
    id: `documents-${d.sourceSheet}-${d.sourceRow}`,
    department: "documents",
    departmentLabel: "เอกสาร",
    workDate: d.workDate,
    caseNo: d.caseNo,
    companyName: d.company,
    assignee: d.assignee,
    detail: d.detail,
    quotationStatus: null,
    paymentStatus: d.paymentStatus || null,
    followUp1: null,
    followUp2: null,
    followUp3: d.latestFollowUp || null,
    customerStatus: null,
    actualStatus: d.actualStatus,
    statusGroup: d.statusGroup,
    latestFollowUp: d.latestFollowUp,
    links: [...link("ใบเสนอราคา", d.quotationLink), ...link("สัญญา", d.contractLink)],
    sourceSheet: d.sourceSheet,
    sourceRow: d.sourceRow,
  };
}
