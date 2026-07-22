import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

export interface KpiCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  color: "blue" | "green" | "amber" | "red" | "purple" | "teal";
  suffix?: string;
  decimals?: number;
  feature?: boolean;
  note?: string;
  onClick?: () => void;
}

const ICON_BG: Record<KpiCardProps["color"], string> = {
  blue: "bg-brand-600/10 text-brand-600",
  green: "bg-success/10 text-success",
  amber: "bg-warning/15 text-warning",
  red: "bg-danger/10 text-danger",
  purple: "bg-purple/10 text-purple",
  teal: "bg-teal/10 text-teal",
};

export function KpiCard({ label, value, icon: Icon, color, suffix, decimals, feature, note, onClick }: KpiCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className={cn(
        "surface-card group relative overflow-hidden p-4 text-left transition hover:shadow-cardHover",
        feature && "ring-1 ring-brand-600/25",
      )}
    >
      {feature && <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-600 to-purple" />}
      <div className={cn("mb-3 grid h-10 w-10 place-items-center rounded-xl", ICON_BG[color])}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-[12.5px] font-medium text-muted dark:text-slate-400">{label}</div>
      <div className="mt-0.5 text-[28px] font-extrabold leading-tight tracking-tight">
        <AnimatedNumber value={value} decimals={decimals} suffix={suffix} />
      </div>
      <div className="mt-2 text-xs text-slate-400 dark:text-slate-500">{value ? note ?? "อัปเดตจากระบบ" : "ยังไม่มีข้อมูล"}</div>
    </motion.button>
  );
}
