import type { CustomerStatusGroup } from "@/types/customer-dashboard";
import { GROUP_META } from "./groups";
import { cn } from "@/lib/utils";

const CHIP: Record<CustomerStatusGroup, string> = {
  in_progress: "bg-purple/10 text-purple",
  completed: "bg-success/10 text-success",
  issues: "bg-danger/10 text-danger",
  unclassified: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

/** แสดงค่าสถานะดิบ + สีตามกลุ่ม (fallback ป้ายกลุ่มเมื่อค่าดิบว่าง) */
export function StatusChip({ raw, group }: { raw: string; group: CustomerStatusGroup }) {
  const text = raw.trim() || GROUP_META[group].label;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold", CHIP[group])}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: GROUP_META[group].color }} />
      {text}
    </span>
  );
}
