import type { WorkloadLevel } from "@/types/documents-dashboard";

export const WORKLOAD_META: Record<WorkloadLevel, { label: string; color: string; chip: string }> = {
  idle: { label: "ว่าง", color: "#94A3B8", chip: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" },
  normal: { label: "ปกติ", color: "#16A34A", chip: "bg-success/10 text-success" },
  moderate: { label: "ปานกลาง", color: "#1D4ED8", chip: "bg-brand-600/10 text-brand-600" },
  high: { label: "สูง", color: "#F59E0B", chip: "bg-warning/15 text-amber-700 dark:text-amber-400" },
  critical: { label: "สูงมาก", color: "#EF4444", chip: "bg-danger/10 text-danger" },
};
