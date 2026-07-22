import { TrendingUp, AlertTriangle, Clock } from "lucide-react";
import type { Insight, DashboardSummary, OrgNode, Employee } from "@/types";
import { slaColor, cn } from "@/lib/utils";
import { Drawer } from "@/components/ui/Drawer";
import { Avatar } from "@/components/ui/primitives";

const INSIGHT_CFG = {
  warn: { icon: TrendingUp, cls: "bg-warning/15 text-warning" },
  danger: { icon: AlertTriangle, cls: "bg-danger/10 text-danger" },
  success: { icon: TrendingUp, cls: "bg-success/10 text-success" },
  info: { icon: Clock, cls: "bg-brand-600/10 text-brand-600" },
} as const;

export function InsightPanel({ insights }: { insights: Insight[] }) {
  return (
    <div className="space-y-2.5">
      {insights.map((it, i) => {
        const cfg = INSIGHT_CFG[it.type];
        const Icon = cfg.icon;
        return (
          <div key={i} className="flex gap-3 rounded-xl border border-line/70 bg-white/70 p-3 transition hover:translate-x-0.5 dark:border-slate-800 dark:bg-slate-900/40">
            <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", cfg.cls)}>
              <Icon className="h-[18px] w-[18px]" />
            </div>
            <div>
              <div className="text-[13px] font-semibold">{it.title}</div>
              <div className="mt-0.5 text-xs text-muted dark:text-slate-400">{it.desc}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function TopPerformers({ list }: { list: DashboardSummary["topPerformers"] }) {
  return (
    <div className="space-y-3">
      {list.map((e, i) => (
        <div key={e.id} className="flex items-center gap-3">
          <div className={cn("grid h-6 w-6 place-items-center rounded-lg font-num text-xs font-bold", i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-slate-200 text-slate-600" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-surface text-muted")}>
            {i + 1}
          </div>
          <Avatar name={e.name} img={e.img} size={32} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold">{e.name}</div>
            <div className="text-[11.5px] text-muted">{e.role}</div>
          </div>
          <div className="tnum text-sm font-bold text-success">{e.perf}%</div>
        </div>
      ))}
    </div>
  );
}

export function RiskWidget({ summary }: { summary: DashboardSummary }) {
  const risks = [
    { label: "ภาระงานสูง (Burnout Risk)", value: summary.burnoutRisk, color: "text-danger" },
    { label: "อยู่ระหว่างดำเนินการ", value: summary.inProgress, color: "text-warning" },
    { label: "งานเสร็จสิ้น", value: summary.doneTasks, color: "text-success" },
  ];
  return (
    <div className="space-y-3">
      {risks.map((r) => (
        <div key={r.label} className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-surface dark:bg-slate-800">
            <AlertTriangle className="h-[18px] w-[18px] text-muted" />
          </div>
          <div className="flex-1 text-[13.5px] font-semibold">{r.label}</div>
          <div className={cn("font-num text-xl font-extrabold", r.color)}>{r.value}</div>
        </div>
      ))}
      <div className="rounded-xl bg-surface p-3 dark:bg-slate-800/50">
        <div className="mb-1.5 flex justify-between text-[12.5px]">
          <span>Team Capacity</span>
          <b className="tnum">{summary.capacity}%</b>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-line dark:bg-slate-700">
          <div className="h-full rounded-full bg-gradient-to-r from-warning to-danger" style={{ width: `${summary.capacity}%` }} />
        </div>
        <p className="mt-2 text-xs text-muted dark:text-slate-400">Workload Forecast: คาดว่าจะเพิ่มขึ้น {summary.workloadForecast}% สัปดาห์หน้า</p>
      </div>
    </div>
  );
}

export function OrgChart({ nodes, onSelect }: { nodes: OrgNode[]; onSelect: (id: number) => void }) {
  const head = nodes.find((n) => n.reportsTo === null);
  const members = nodes.filter((n) => n.reportsTo !== null);
  if (!head) return null;
  const Node = ({ n }: { n: OrgNode }) => (
    <button onClick={() => onSelect(n.id)} className="flex min-w-[170px] items-center gap-2.5 rounded-2xl border border-line bg-white p-3 shadow-card transition hover:border-brand-600 hover:shadow-cardHover dark:border-slate-800 dark:bg-[#111a2e]">
      <Avatar name={n.name} img={n.img} size={36} />
      <div className="text-left">
        <div className="text-[13px] font-semibold">{n.name.split(" ")[0]}</div>
        <div className="text-[11px] text-muted">{n.role}</div>
        <div className="text-[10.5px] font-semibold text-brand-600">{n.active} งาน</div>
      </div>
    </button>
  );
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max flex-col items-center gap-4">
        <Node n={head} />
        <div className="h-5 w-px bg-line dark:bg-slate-700" />
        <div className="flex flex-wrap justify-center gap-3">
          {members.map((n) => (
            <Node key={n.id} n={n} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function EmployeeDrawer({ employee, onClose }: { employee: Employee | null; onClose: () => void }) {
  return (
    <Drawer open={!!employee} onClose={onClose} title="โปรไฟล์พนักงาน">
      {employee && (
        <div>
          <div className="pb-4 text-center">
            <Avatar name={employee.name} img={employee.img} size={80} className="mx-auto rounded-2xl shadow-card" />
            <h3 className="mt-3 flex items-center justify-center gap-2 text-lg font-bold">
              {employee.name}
              <span className={cn("h-2.5 w-2.5 rounded-full", employee.online ? "bg-success" : "bg-slate-300")} />
            </h3>
            <p className="text-sm text-muted">{employee.role} · {employee.dept}</p>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              ["งานกำลังทำ", employee.active, undefined],
              ["งานเสร็จแล้ว", employee.done, undefined],
              ["SLA", `${employee.sla}%`, slaColor(employee.sla)],
              ["ประสิทธิภาพ", `${employee.perf}%`, undefined],
            ].map(([label, val, color]) => (
              <div key={label as string} className="rounded-xl border border-line/70 bg-surface p-3 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="tnum text-xl font-extrabold" style={color ? { color: color as string } : undefined}>
                  {val}
                </div>
                <div className="text-[11.5px] text-muted">{label}</div>
              </div>
            ))}
          </div>
          <div className="mt-5">
            <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted">ข้อมูลติดต่อ</h4>
            <div className="space-y-2 text-[13px]">
              <Row label="อีเมล" value={employee.email} />
              <Row label="โทรศัพท์" value={employee.phone} />
              <Row label="ปีที่เริ่มงาน" value={employee.joinYear} />
              <Row label="วันลาคงเหลือ" value={`${employee.leaveLeft} วัน`} />
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span className="tnum font-semibold">{value}</span>
    </div>
  );
}
