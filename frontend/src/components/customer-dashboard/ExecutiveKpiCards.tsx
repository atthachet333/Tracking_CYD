import { motion } from "framer-motion";
import { Users, CheckCircle2, TriangleAlert, Activity, type LucideIcon } from "lucide-react";
import type { CustomerDashboardSummary, CustomerStatusGroup } from "@/types/customer-dashboard";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Skeleton, ErrorState } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

export type FocusGroup = CustomerStatusGroup | "all";

interface Props {
  summary?: CustomerDashboardSummary;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  active: FocusGroup | null;
  onSelect: (g: FocusGroup) => void;
}

const COLORS = {
  blue: "bg-brand-600/10 text-brand-600",
  green: "bg-success/10 text-success",
  red: "bg-danger/10 text-danger",
  amber: "bg-warning/15 text-warning",
} as const;

function Kpi({
  label, value, icon: Icon, color, note, suffix, decimals, feature, pulse, active, onClick,
}: {
  label: string; value: number; icon: LucideIcon; color: keyof typeof COLORS; note?: string;
  suffix?: string; decimals?: number; feature?: boolean; pulse?: boolean; active?: boolean; onClick?: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      title={`${label} — ${value.toLocaleString("en-US")}${suffix ?? ""} (คลิกเพื่อกรองตาราง)`}
      aria-pressed={active}
      className={cn(
        "surface-card group relative overflow-hidden p-4 text-left outline-none transition hover:shadow-cardHover focus-visible:ring-2 focus-visible:ring-brand-600",
        feature && "ring-1 ring-brand-600/25",
        active && "ring-2 ring-brand-600",
      )}
    >
      {feature && <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-600 via-purple to-brand-600" />}
      <div className="flex items-start justify-between">
        <div className={cn("mb-3 grid h-10 w-10 place-items-center rounded-xl", COLORS[color])}>
          <Icon className="h-5 w-5" />
        </div>
        {pulse && (
          <span className="relative flex h-2.5 w-2.5" aria-label="ต้องติดตาม">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-danger" />
          </span>
        )}
      </div>
      <div className="text-[12.5px] font-medium text-muted dark:text-slate-400">{label}</div>
      <div className="mt-0.5 text-[28px] font-extrabold leading-tight tracking-tight">
        <AnimatedNumber value={value} decimals={decimals} suffix={suffix} />
      </div>
      <div className="mt-2 text-xs text-slate-400 dark:text-slate-500">{note ?? "อัปเดตจากระบบ"}</div>
    </motion.button>
  );
}

/** KPI 4 ใบ ตามลำดับ: ลูกค้าทั้งหมด → ปิดเคสสำเร็จ → ปัญหา → กำลังดำเนินการ */
export function ExecutiveKpiCards({ summary, isLoading, isError, onRetry, active, onSelect }: Props) {
  if (isError) {
    return <div className="surface-card mb-4 p-4"><ErrorState message="โหลดสรุปลูกค้าไม่สำเร็จ" onRetry={onRetry} /></div>;
  }
  if (isLoading || !summary) {
    return (
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[122px]" />)}
      </div>
    );
  }
  const s = summary;
  return (
    <div className="mb-4 space-y-3">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi
          label="ลูกค้าทั้งหมด" value={s.totalCustomers} icon={Users} color="blue" feature
          note={`บริษัทไม่ซ้ำ ${s.uniqueCompanies} · เคสไม่ซ้ำ ${s.uniqueCases}`}
          active={active === "all"} onClick={() => onSelect("all")}
        />
        <Kpi
          label="ปิดเคสสำเร็จ" value={s.completed} icon={CheckCircle2} color="green"
          note={`Completion Rate ${s.completionRate}%`}
          active={active === "completed"} onClick={() => onSelect("completed")}
        />
        <Kpi
          label="ปัญหาที่พบเจอ" value={s.issues} icon={TriangleAlert} color="red" pulse={s.issues > 0}
          note={`Issue Rate ${s.issueRate}%`}
          active={active === "issues"} onClick={() => onSelect("issues")}
        />
        <Kpi
          label="กำลังดำเนินการ" value={s.inProgress} icon={Activity} color="amber"
          note={`In Progress ${s.inProgressRate}%`}
          active={active === "in_progress"} onClick={() => onSelect("in_progress")}
        />
      </div>
      {s.unclassified > 0 && (
        <button
          onClick={() => onSelect("unclassified")}
          className={cn(
            "flex w-full items-center gap-2 rounded-xl border border-line bg-slate-50/60 px-4 py-2 text-left text-[12.5px] text-muted outline-none transition hover:bg-surface focus-visible:ring-2 focus-visible:ring-brand-600 dark:border-slate-800 dark:bg-slate-900/40",
            active === "unclassified" && "ring-2 ring-brand-600",
          )}
        >
          <span className="h-2 w-2 rounded-full bg-slate-400" />
          <b className="tnum text-ink dark:text-slate-200">{s.unclassified}</b> รายการยังไม่ระบุสถานะ — โปรดตรวจสอบข้อมูลใน Google Sheets
        </button>
      )}
    </div>
  );
}
