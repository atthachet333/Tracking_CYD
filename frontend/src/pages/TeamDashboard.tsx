import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Users, Activity, Flame, ShieldCheck, Files } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { useUnifiedTasks } from "@/hooks/useUnifiedTasks";
import { useCustomerSummary } from "@/hooks/useCustomerDashboard";
import { useDocumentsSummary } from "@/hooks/useDocumentsDashboard";
import type { TaskDepartment, WorkloadLevel } from "@/types/documents-dashboard";
import type { CustomerStatusGroup } from "@/types/customer-dashboard";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { WORKLOAD_META } from "@/components/documents-dashboard/workload";
import { Card, PageHeader, SectionTitle, Skeleton, ErrorState, EmptyState, Avatar, TagSoft } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const AXIS = { fontSize: 12, fontFamily: "IBM Plex Sans Thai", fill: "#94a3b8" };
const tooltipStyle = { borderRadius: 12, border: "1px solid rgba(148,163,184,.3)", fontSize: 13, fontFamily: "IBM Plex Sans Thai", background: "#0f1728", color: "#e2e8f0" };

function levelOf(total: number): WorkloadLevel {
  if (total >= 15) return "critical";
  if (total >= 9) return "high";
  if (total >= 5) return "moderate";
  if (total >= 1) return "normal";
  return "idle";
}

interface Emp {
  name: string;
  departments: TaskDepartment[];
  total: number;
  inProgress: number;
  completed: number;
  issues: number;
  companies: number;
  latestDate: string | null;
  level: WorkloadLevel;
}

type Tab = "all" | TaskDepartment;

export function TeamDashboard() {
  const unified = useUnifiedTasks({ pageSize: 1000 });
  const customer = useCustomerSummary();
  const documents = useDocumentsSummary();
  const [tab, setTab] = useState<Tab>("all");

  const rows = useMemo(() => unified.data?.data ?? [], [unified.data?.data]);

  const employees = useMemo<Emp[]>(() => {
    const map = new Map<string, { depts: Set<TaskDepartment>; total: number; ip: number; done: number; iss: number; companies: Set<string>; latest: string | null }>();
    for (const r of rows) {
      if (!r.assignee) continue;
      const e = map.get(r.assignee) ?? { depts: new Set<TaskDepartment>(), total: 0, ip: 0, done: 0, iss: 0, companies: new Set<string>(), latest: null };
      e.depts.add(r.department);
      e.total++;
      const g: CustomerStatusGroup = r.statusGroup;
      if (g === "in_progress") e.ip++; else if (g === "completed") e.done++; else if (g === "issues") e.iss++;
      if (r.companyName) e.companies.add(r.companyName.toLowerCase());
      if (r.workDate && (!e.latest || r.workDate > e.latest)) e.latest = r.workDate;
      map.set(r.assignee, e);
    }
    return [...map.entries()]
      .map(([name, e]) => ({ name, departments: [...e.depts], total: e.total, inProgress: e.ip, completed: e.done, issues: e.iss, companies: e.companies.size, latestDate: e.latest, level: levelOf(e.total) }))
      .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
  }, [rows]);

  const teamCounts = useMemo(() => ({
    all: employees.length,
    admin: employees.filter((e) => e.departments.includes("admin")).length,
    documents: employees.filter((e) => e.departments.includes("documents")).length,
    active: employees.filter((e) => e.inProgress > 0).length,
    high: employees.filter((e) => e.level === "high" || e.level === "critical").length,
  }), [employees]);

  const shown = useMemo(() => (tab === "all" ? employees : employees.filter((e) => e.departments.includes(tab))), [employees, tab]);
  const cs = customer.data?.data;
  const ds = documents.data?.data;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <PageHeader title="ภาพรวมแอดมินและเอกสาร" subtitle="สรุปทีมงาน ภาระงาน และผลการดำเนินงานของทีม Admin และแผนกเอกสาร" />

      {/* Section 1 — Team Summary */}
      {unified.isLoading ? (
        <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-5">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[122px]" />)}</div>
      ) : unified.isError ? (
        <Card className="mb-4 p-6"><ErrorState message="โหลดข้อมูลทีมไม่สำเร็จ" onRetry={() => unified.refetch()} /></Card>
      ) : (
        <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-5">
          <KpiCard label="พนักงานทั้งหมด" value={teamCounts.all} icon={Users} color="blue" feature />
          <KpiCard label="ทีม Admin" value={teamCounts.admin} icon={ShieldCheck} color="purple" />
          <KpiCard label="ทีมเอกสาร" value={teamCounts.documents} icon={Files} color="teal" />
          <KpiCard label="มีงานกำลังทำ" value={teamCounts.active} icon={Activity} color="amber" />
          <KpiCard label="ภาระงานสูง" value={teamCounts.high} icon={Flame} color="red" />
        </div>
      )}

      {/* Section 2 — Team Tabs */}
      <div className="mb-4 inline-flex rounded-xl border border-line p-1 dark:border-slate-700">
        {([["all", "ภาพรวมทั้งหมด"], ["admin", "ทีม Admin"], ["documents", "ทีมเอกสาร"]] as const).map(([v, label]) => (
          <button key={v} onClick={() => setTab(v)} className={cn("rounded-lg px-4 py-1.5 text-[13px] font-semibold transition", tab === v ? "bg-brand-600 text-white" : "text-muted hover:bg-surface dark:hover:bg-slate-800")}>{label}</button>
        ))}
      </div>

      {/* Section 3 — รายชื่อพนักงาน + Section 4 workload */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_420px]">
        <Card className="p-5">
          <SectionTitle title="รายชื่อพนักงาน" sub={`${shown.length} คน`} />
          {unified.isLoading ? <Skeleton className="h-72" /> : shown.length === 0 ? <EmptyState msg="ไม่มีพนักงานในทีมนี้" icon="inbox" /> : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-line dark:border-slate-800">
                    {["พนักงาน", "ทีม", "ทั้งหมด", "กำลังทำ", "เสร็จ", "ปัญหา", "บริษัท", "ภาระงาน", "ล่าสุด"].map((h, i) => (
                      <th key={h} className={cn("px-2.5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted", i < 2 ? "text-left" : "text-center")}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shown.map((e) => (
                    <tr key={e.name} className="border-b border-line/60 hover:bg-surface dark:border-slate-800/60 dark:hover:bg-slate-800/40">
                      <td className="px-2.5 py-2.5"><div className="flex items-center gap-2"><Avatar name={e.name} size={28} /><span className="font-semibold">{e.name}</span></div></td>
                      <td className="px-2.5 py-2.5"><div className="flex gap-1">{e.departments.map((d) => <TagSoft key={d}>{d === "admin" ? "Admin" : "เอกสาร"}</TagSoft>)}</div></td>
                      <td className="px-2.5 py-2.5 text-center tnum font-semibold">{e.total}</td>
                      <td className="px-2.5 py-2.5 text-center tnum text-warning">{e.inProgress}</td>
                      <td className="px-2.5 py-2.5 text-center tnum text-success">{e.completed}</td>
                      <td className="px-2.5 py-2.5 text-center tnum text-danger">{e.issues}</td>
                      <td className="px-2.5 py-2.5 text-center tnum">{e.companies}</td>
                      <td className="px-2.5 py-2.5 text-center"><span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold", WORKLOAD_META[e.level].chip)}>{WORKLOAD_META[e.level].label}</span></td>
                      <td className="px-2.5 py-2.5 text-center tnum text-muted">{e.latestDate ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <SectionTitle title="Workload Distribution" sub="งานต่อพนักงาน" />
          {unified.isLoading ? <Skeleton className="h-72" /> : shown.length === 0 ? <EmptyState msg="ไม่มีข้อมูล" /> : (
            <ResponsiveContainer width="100%" height={Math.max(220, shown.length * 34 + 20)}>
              <BarChart data={shown.slice(0, 12)} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,.15)" horizontal={false} />
                <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={100} tick={{ ...AXIS, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(148,163,184,.08)" }} formatter={(v: number) => [`${v} งาน`, ""]} />
                <Bar dataKey="total" radius={[0, 6, 6, 0]} maxBarSize={22}>{shown.slice(0, 12).map((e) => <Cell key={e.name} fill={WORKLOAD_META[e.level].color} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Section 6 — Department detail */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <SectionTitle title="ทีม Admin" sub="งานลูกค้า/เคส" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="พนักงาน" value={teamCounts.admin} />
            <Stat label="เคส" value={cs?.totalCustomers ?? 0} />
            <Stat label="ลูกค้า" value={cs?.uniqueCompanies ?? 0} />
            <Stat label="กำลังดำเนินการ" value={cs?.inProgress ?? 0} color="text-warning" />
            <Stat label="ปิดสำเร็จ" value={cs?.completed ?? 0} color="text-success" />
            <Stat label="มีปัญหา" value={cs?.issues ?? 0} color="text-danger" />
          </div>
        </Card>
        <Card className="p-5">
          <SectionTitle title="แผนกเอกสาร" sub="งานเอกสาร" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="พนักงาน" value={teamCounts.documents} />
            <Stat label="งาน" value={ds?.totalItems ?? 0} />
            <Stat label="บริษัท" value={ds?.uniqueCompanies ?? 0} />
            <Stat label="กำลังดำเนินการ" value={ds?.inProgress ?? 0} color="text-warning" />
            <Stat label="เสร็จสิ้น" value={ds?.completed ?? 0} color="text-success" />
            <Stat label="มีปัญหา" value={ds?.issues ?? 0} color="text-danger" />
          </div>
        </Card>
      </div>
    </motion.div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-xl border border-line p-3 dark:border-slate-800">
      <div className="text-[11.5px] text-muted">{label}</div>
      <div className={cn("tnum mt-1 text-xl font-bold", color)}>{value}</div>
    </div>
  );
}
