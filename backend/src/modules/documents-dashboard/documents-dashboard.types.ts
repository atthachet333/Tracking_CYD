/* ============================================================
   Documents Dashboard · internal types + config
   ============================================================ */
import type { DocumentTaskItem, WorkloadLevel } from "@tracking-cyd/shared";

export interface DocumentsDataset {
  items: DocumentTaskItem[];
  headers: string[];
  statusHeader: string | null;
  unknownStatuses: string[];
  rowsRead: number;
  warnings: string[];
  generatedAt: string;
  preview: string[][]; // 5–10 แถวแรก (raw) สำหรับหน้า Integration
}

/** Threshold ระดับภาระงาน (จำนวนงานต่อคน) — configurable ที่เดียว */
export const WORKLOAD_THRESHOLDS: { level: WorkloadLevel; min: number }[] = [
  { level: "critical", min: 15 },
  { level: "high", min: 9 },
  { level: "moderate", min: 5 },
  { level: "normal", min: 1 },
  { level: "idle", min: 0 },
];

export function workloadLevel(total: number): WorkloadLevel {
  return WORKLOAD_THRESHOLDS.find((t) => total >= t.min)?.level ?? "idle";
}
