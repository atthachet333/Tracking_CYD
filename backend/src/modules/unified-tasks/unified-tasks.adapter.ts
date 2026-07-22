/* ============================================================
   Unified Tasks Adapter (pure) — แปลง Admin (customer cases) และ Documents
   ให้เป็น UnifiedTask รูปแบบเดียวกัน
   ============================================================ */
import type { CustomerCaseItem, DocumentTaskItem, UnifiedTask } from "@tracking-cyd/shared";

function links(...urls: string[]): string[] {
  return urls.map((u) => (u ?? "").trim()).filter((u) => /^https?:\/\//i.test(u));
}

export function adminToUnified(c: CustomerCaseItem): UnifiedTask {
  return {
    id: `admin-${c.sourceSheet}-${c.sourceRow}`,
    department: "admin",
    workDate: c.date,
    caseNo: c.caseNo,
    companyName: c.company,
    assignee: c.assignee,
    detail: c.initialDetail || c.customerStatus,
    actualStatus: c.customerStatus,
    statusGroup: c.statusGroup,
    latestFollowUp: c.latestFollowUp,
    links: links(c.quotationLink, c.contractLink),
    sourceSheet: c.sourceSheet,
    sourceRow: c.sourceRow,
  };
}

export function documentToUnified(d: DocumentTaskItem): UnifiedTask {
  return {
    id: `documents-${d.sourceSheet}-${d.sourceRow}`,
    department: "documents",
    workDate: d.workDate,
    caseNo: d.caseNo,
    companyName: d.company,
    assignee: d.assignee,
    detail: d.detail,
    actualStatus: d.actualStatus,
    statusGroup: d.statusGroup,
    latestFollowUp: d.latestFollowUp,
    links: links(d.quotationLink, d.contractLink),
    sourceSheet: d.sourceSheet,
    sourceRow: d.sourceRow,
  };
}
