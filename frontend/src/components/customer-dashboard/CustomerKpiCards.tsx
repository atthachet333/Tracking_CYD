import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Users, Activity, CheckCircle2, AlertTriangle, HelpCircle, type LucideIcon } from "lucide-react";
import type { CustomerDashboardSummary, CustomerStatusGroup } from "@/types/customer-dashboard";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Skeleton, ErrorState } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

type FocusGroup = CustomerStatusGroup | "all";

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
  purple: "bg-purple/10 text-purple",
  green: "bg-success/10 text-success",
  red: "bg-danger/10 text-danger",
  slate: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
} as const;

/** Confetti แบบสุภาพ: จุดเล็ก ๆ กระจายสั้น ๆ (เคารพ prefers-reduced-motion) */
function Confetti({ show }: { show: boolean }) {
  const reduce = useReducedMotion();
  if (!show || reduce) return null;
  const dots = Array.from({ length: 10 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {dots.map((_, i) => {
        const x = (Math.random() - 0.5) * 120;
        const c = ["#16A34A", "#1D4ED8", "#F59E0B", "#8B5CF6"][i % 4];
        return (
          <motion.span
            key={i}
            initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            animate={{ opacity: 0, x, y: -60 - Math.random() * 40, scale: 0.4 }}
            transition={{ duration: 1.1, ease: "easeOut" }}
            className="absolute left-1/2 top-6 h-1.5 w-1.5 rounded-full"
            style={{ background: c }}
          />
        );
      })}
    </div>
  );
}

function KpiCard({
  label, value, icon: Icon, color, note, decimals, suffix, feature, pulse, confetti, active, onClick, secondary,
}: {
  label: string; value: number; icon: LucideIcon; color: keyof typeof COLORS; note?: string;
  decimals?: number; suffix?: string; feature?: boolean; pulse?: boolean; confetti?: boolean;
  active?: boolean; onClick?: () => void; secondary?: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      title={`${label} — ${value.toLocaleString("en-US")}${suffix ?? ""} (คลิกเพื่อกรอง)`}
      aria-pressed={active}
      className={cn(
        "surface-card group relative overflow-hidden p-4 text-left outline-none transition hover:shadow-cardHover focus-visible:ring-2 focus-visible:ring-brand-600",
        feature && "ring-1 ring-brand-600/25",
        active && "ring-2 ring-brand-600",
        secondary && "bg-slate-50/60 dark:bg-slate-900/40",
      )}
    >
      {feature && <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-600 via-purple to-brand-600" />}
      <Confetti show={Boolean(confetti)} />
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
      <div className={cn("mt-0.5 font-extrabold leading-tight tracking-tight", secondary ? "text-[22px]" : "text-[28px]")}>
        <AnimatedNumber value={value} decimals={decimals} suffix={suffix} />
      </div>
      <div className="mt-2 text-xs text-slate-400 dark:text-slate-500">{note ?? "อัปเดตจากระบบ"}</div>
    </motion.button>
  );
}

export function CustomerKpiCards({ summary, isLoading, isError, onRetry, active, onSelect }: Props) {
  const reduce = useReducedMotion();
  const [confetti, setConfetti] = useState(false);
  const prevCompleted = useRef<number | null>(null);

  // Confetti เมื่อจำนวน "ปิดสำเร็จ" เพิ่มขึ้นหลัง refresh
  useEffect(() => {
    if (summary == null) return undefined;
    const prev = prevCompleted.current;
    prevCompleted.current = summary.completed;
    if (prev != null && summary.completed > prev && !reduce) {
      setConfetti(true);
      const t = setTimeout(() => setConfetti(false), 1300);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [summary, reduce]);

  if (isError) {
    return (
      <div className="surface-card mb-4 p-4">
        <ErrorState message="โหลดสรุปลูกค้าไม่สำเร็จ" onRetry={onRetry} />
      </div>
    );
  }
  if (isLoading || !summary) {
    return (
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[122px]" />)}
      </div>
    );
  }

  return (
    <div className="mb-4 space-y-3">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="ลูกค้าทั้งหมด" value={summary.totalCustomers} icon={Users} color="blue" feature
          note="คลิกเพื่อดูรายการทั้งหมด" active={active === "all"} onClick={() => onSelect("all")}
        />
        <KpiCard
          label="กำลังดำเนินการ" value={summary.inProgress} icon={Activity} color="purple"
          note="คลิกเพื่อกรองเฉพาะกลุ่มนี้" active={active === "in_progress"} onClick={() => onSelect("in_progress")}
        />
        <KpiCard
          label="ปิดเคสสำเร็จ" value={summary.completed} icon={CheckCircle2} color="green"
          note={`อัตราปิดสำเร็จ ${summary.completionRate}%`} confetti={confetti}
          active={active === "completed"} onClick={() => onSelect("completed")}
        />
        <KpiCard
          label="เคสที่มีปัญหา" value={summary.issues} icon={AlertTriangle} color="red"
          note={`คิดเป็น ${summary.issueRate}% ของทั้งหมด`} pulse={summary.issues > 0}
          active={active === "issues"} onClick={() => onSelect("issues")}
        />
      </div>

      <KpiCard
        label="ยังไม่ระบุสถานะ" value={summary.unclassified} icon={HelpCircle} color="slate" secondary
        note={summary.unclassified > 0 ? "โปรดตรวจสอบข้อมูลสถานะใน Google Sheets" : "ไม่มีรายการค้าง"}
        active={active === "unclassified"} onClick={() => onSelect("unclassified")}
      />
    </div>
  );
}
