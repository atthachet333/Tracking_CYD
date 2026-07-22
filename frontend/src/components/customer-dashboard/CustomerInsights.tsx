import { TrendingUp, AlertTriangle, CheckCircle2, Info, type LucideIcon } from "lucide-react";
import type { CustomerInsight } from "@/types/customer-dashboard";
import { cn } from "@/lib/utils";

const STYLE: Record<CustomerInsight["type"], { icon: LucideIcon; box: string; ic: string }> = {
  danger: { icon: AlertTriangle, box: "border-danger/20 bg-danger/5", ic: "text-danger" },
  warn: { icon: AlertTriangle, box: "border-warning/25 bg-warning/5", ic: "text-warning" },
  success: { icon: CheckCircle2, box: "border-success/20 bg-success/5", ic: "text-success" },
  info: { icon: Info, box: "border-brand-600/20 bg-brand-600/5", ic: "text-brand-600" },
};

/** Executive Insight — ข้อความสร้างจาก rule-based ฝั่ง backend (ไม่มีค่า hardcode) */
export function CustomerInsights({ insights }: { insights: CustomerInsight[] }) {
  if (!insights.length) {
    return <div className="flex items-center gap-2 text-sm text-muted"><TrendingUp className="h-4 w-4" /> ยังไม่มีข้อมูลเพียงพอสำหรับการวิเคราะห์</div>;
  }
  return (
    <div className="space-y-2.5">
      {insights.map((it, i) => {
        const s = STYLE[it.type];
        const Icon = s.icon;
        return (
          <div key={i} className={cn("flex gap-3 rounded-xl border p-3", s.box)}>
            <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", s.ic)} />
            <div>
              <div className="text-[13.5px] font-semibold">{it.title}</div>
              <div className="mt-0.5 text-[12.5px] text-muted">{it.desc}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
