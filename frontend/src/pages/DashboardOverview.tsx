import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Users, ListTodo, CheckCircle2, TriangleAlert, Activity, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from "recharts";
import { useCustomerSummary, useRefreshCustomerDashboard } from "@/hooks/useCustomerDashboard";
import { useDocumentsSummary, useRefreshDocumentsDashboard } from "@/hooks/useDocumentsDashboard";
import { useUnifiedTasks } from "@/hooks/useUnifiedTasks";
import type { CustomerStatusGroup } from "@/types/customer-dashboard";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { DepartmentComparisonChart, type DeptRow } from "@/components/executive/DepartmentComparisonChart";
import { CustomerStatusDonut } from "@/components/customer-dashboard/CustomerStatusDonut";
import { CustomerInsights } from "@/components/customer-dashboard/CustomerInsights";
import { StatusChip } from "@/components/customer-dashboard/StatusChip";
import { GROUP_META } from "@/components/customer-dashboard/groups";
import { SheetConnectionBar } from "@/components/dashboard/SheetConnection";
import { Card, PageHeader, SectionTitle, Button, Skeleton, EmptyState } from "@/components/ui/primitives";
import { useUiStore } from "@/stores/uiStore";
import { cn } from "@/lib/utils";

const AXIS = { fontSize: 12, fontFamily: "IBM Plex Sans Thai", fill: "#94a3b8" };
const tooltipStyle = { borderRadius: 12, border: "1px solid rgba(148,163,184,.3)", fontSize: 13, fontFamily: "IBM Plex Sans Thai", background: "#0f1728", color: "#e2e8f0" };
const GROUP_LABEL: Record<CustomerStatusGroup, string> = { in_progress: GROUP_META.in_progress.label, completed: GROUP_META.completed.label, issues: GROUP_META.issues.label, unclassified: GROUP_META.unclassified.label };

export function DashboardOverview() {
  const navigate = useNavigate();
  const customer = useCustomerSummary();
  const documents = useDocumentsSummary();
  const unified = useUnifiedTasks({ pageSize: 1000 });
  const refreshCustomer = useRefreshCustomerDashboard();
  const refreshDocs = useRefreshDocumentsDashboard();
  const pushToast = useUiStore((s) => s.pushToast);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const cs = customer.data?.data;
  const ds = documents.data?.data;
  const rows = useMemo(() => unified.data?.data ?? [], [unified.data?.data]);
  const loading = customer.isLoading || documents.isLoading || unified.isLoading;

  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refreshCustomer(), refreshDocs()]);
      pushToast({ title: "รีเฟรชสำเร็จ", desc: "ดึงข้อมูล Admin + เอกสารล่าสุด", type: "success" });
    } catch (e) {
      pushToast({ title: "รีเฟรชไม่สำเร็จ", desc: (e as Error).message, type: "error" });
    } finally {
      setIsRefreshing(false);
    }
  };

  // ---- computed from unified (Admin + Documents) ----
  const combined = useMemo(() => {
    const dist = new Map<CustomerStatusGroup, number>();
    const byDept = { admin: { total: 0, in_progress: 0, completed: 0, issues: 0 }, documents: { total: 0, in_progress: 0, completed: 0, issues: 0 } };
    const workload = new Map<string, number>();
    const companies = new Map<string, number>();
    const teamAll = new Set<string>(), teamAdmin = new Set<string>(), teamDocs = new Set<string>();
    for (const r of rows) {
      dist.set(r.statusGroup, (dist.get(r.statusGroup) ?? 0) + 1);
      const d = byDept[r.department];
      d.total++;
      if (r.statusGroup === "in_progress") d.in_progress++;
      else if (r.statusGroup === "completed") d.completed++;
      else if (r.statusGroup === "issues") d.issues++;
      if (r.assignee) { workload.set(r.assignee, (workload.get(r.assignee) ?? 0) + 1); teamAll.add(r.assignee); (r.department === "admin" ? teamAdmin : teamDocs).add(r.assignee); }
      if (r.companyName) companies.set(r.companyName, (companies.get(r.companyName) ?? 0) + 1);
    }
    const total = rows.length;
    const distribution = (["in_progress", "completed", "issues", "unclassified"] as CustomerStatusGroup[]).map((key) => {
      const count = dist.get(key) ?? 0;
      return { key, label: GROUP_LABEL[key], count, percentage: total ? Math.round((count / total) * 10000) / 100 : 0 };
    });
    const deptRows: DeptRow[] = [
      { name: "Admin", ...byDept.admin },
      { name: "เอกสาร", ...byDept.documents },
    ];
    const topWorkload = [...workload.entries()].map(([assignee, count]) => ({ assignee, count })).sort((a, b) => b.count - a.count).slice(0, 8);
    const topCompanies = [...companies.entries()].map(([company, count]) => ({ company, count })).sort((a, b) => b.count - a.count).slice(0, 8);
    const recent = [...rows].sort((a, b) => (b.workDate ?? "").localeCompare(a.workDate ?? "")).slice(0, 10);
    return { distribution, deptRows, topWorkload, topCompanies, recent, teamAll: teamAll.size, teamAdmin: teamAdmin.size, teamDocs: teamDocs.size };
  }, [rows]);

  const totalWork = (cs?.totalCustomers ?? 0) === 0 && rows.length === 0 ? 0 : rows.length;
  const completedAll = (cs?.completed ?? 0) + (ds?.completed ?? 0);
  const issuesAll = (cs?.issues ?? 0) + (ds?.issues ?? 0);
  const inProgressAll = (cs?.inProgress ?? 0) + (ds?.inProgress ?? 0);
  const completionRate = totalWork ? Math.round((completedAll / totalWork) * 10000) / 100 : 0;
  const issueRate = totalWork ? Math.round((issuesAll / totalWork) * 10000) / 100 : 0;

  const insights = useMemo(() => [...(customer.data?.insights ?? []), ...(documents.data?.insights ?? [])].slice(0, 5), [customer.data, documents.data]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <PageHeader
        title="Executive Overview"
        subtitle="ภาพรวมลูกค้า งานแอดมิน งานเอกสาร และสถานะการดำเนินงานจากข้อมูลจริง"
        actions={<Button variant="primary" onClick={onRefresh} className={cn(isRefreshing && "opacity-70")}><RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} /> รีเฟรชข้อมูล</Button>}
      />

      <SheetConnectionBar />

      {/* KPI หลัก 4 ใบ */}
      {loading && !cs ? (
        <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[122px]" />)}</div>
      ) : (
        <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard label="ลูกค้าทั้งหมด" value={cs?.totalCustomers ?? 0} icon={Users} color="blue" feature note={`บริษัท ${cs?.uniqueCompanies ?? 0} · เคส ${cs?.uniqueCases ?? 0}`} onClick={() => navigate("/dashboard/customer-overview")} />
          <KpiCard label="งานทั้งหมด (Admin+เอกสาร)" value={totalWork} icon={ListTodo} color="purple" note={`Admin ${cs?.totalCustomers ?? 0} · เอกสาร ${ds?.totalItems ?? 0}`} onClick={() => navigate("/dashboard/tasks")} />
          <KpiCard label="งานเสร็จสิ้น" value={completedAll} icon={CheckCircle2} color="green" note={`Completion ${completionRate}%`} onClick={() => navigate("/dashboard/tasks?statusGroup=completed")} />
          <KpiCard label="งานที่ต้องติดตาม" value={issuesAll} icon={TriangleAlert} color="red" note={`Issue ${issueRate}%`} onClick={() => navigate("/dashboard/tasks?statusGroup=issues")} />
        </div>
      )}

      {/* KPI รอง */}
      <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="กำลังดำเนินการ" value={inProgressAll} icon={Activity} color="amber" onClick={() => navigate("/dashboard/tasks?statusGroup=in_progress")} />
        <KpiCard label="พนักงานทั้งหมด" value={combined.teamAll} icon={Users} color="teal" onClick={() => navigate("/dashboard/team")} />
        <KpiCard label="ทีม Admin" value={combined.teamAdmin} icon={Users} color="blue" onClick={() => navigate("/dashboard/team")} />
        <KpiCard label="ทีมเอกสาร" value={combined.teamDocs} icon={Users} color="purple" onClick={() => navigate("/dashboard/team")} />
        <KpiCard label="บริษัทงานเอกสาร" value={ds?.uniqueCompanies ?? 0} icon={Building2} color="teal" onClick={() => navigate("/dashboard/documents-overview")} />
        <KpiCard label="ยังไม่ระบุสถานะ" value={(cs?.unclassified ?? 0) + (ds?.unclassified ?? 0)} icon={TriangleAlert} color="amber" />
      </div>

      {/* Comparison + Insight */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        <Card className="p-5">
          <SectionTitle title="เปรียบเทียบ Admin กับ เอกสาร" sub="ตามกลุ่มสถานะ" />
          {loading ? <Skeleton className="h-[300px]" /> : <DepartmentComparisonChart data={combined.deptRows} />}
        </Card>
        <Card className="border-brand-600/10 bg-gradient-to-br from-brand-600/[.05] to-purple/[.04] p-5">
          <SectionTitle title="Executive Insight" sub="จากข้อมูลจริง" />
          {loading ? <Skeleton className="h-40" /> : <CustomerInsights insights={insights} />}
        </Card>
      </div>

      {/* Combined status + workload */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <SectionTitle title="สถานะงานรวม (Admin + เอกสาร)" />
          {loading ? <Skeleton className="h-60" /> : <CustomerStatusDonut data={combined.distribution} />}
        </Card>
        <Card className="p-5">
          <SectionTitle title="ภาระงานต่อพนักงาน (Workload)" />
          {loading ? <Skeleton className="h-60" /> : combined.topWorkload.length === 0 ? <EmptyState msg="ยังไม่มีข้อมูล" /> : (
            <ResponsiveContainer width="100%" height={Math.max(200, combined.topWorkload.length * 34 + 20)}>
              <BarChart data={combined.topWorkload} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,.15)" horizontal={false} />
                <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="assignee" width={110} tick={{ ...AXIS, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(148,163,184,.08)" }} formatter={(v: number) => [`${v} งาน`, ""]} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={22}>{combined.topWorkload.map((_, i) => <Cell key={i} fill="#1D4ED8" />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Top companies + recent */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <SectionTitle title="บริษัทที่มีงานมากที่สุด" />
          {loading ? <Skeleton className="h-56" /> : combined.topCompanies.length === 0 ? <EmptyState msg="ยังไม่มีข้อมูล" /> : (
            <div className="space-y-2.5">
              {combined.topCompanies.map((c, i) => (
                <div key={c.company} className="flex items-center gap-3">
                  <div className={cn("grid h-6 w-6 place-items-center rounded-lg font-num text-xs font-bold", i < 3 ? "bg-amber-100 text-amber-700" : "bg-surface text-muted dark:bg-slate-800")}>{i + 1}</div>
                  <div className="min-w-0 flex-1 truncate text-[13px] font-semibold" title={c.company}>{c.company}</div>
                  <div className="tnum text-sm font-bold text-brand-600">{c.count} งาน</div>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <SectionTitle title="งานล่าสุด (รวมทุกแผนก)" />
            <Button onClick={() => navigate("/dashboard/tasks")}>ดูงานทั้งหมด</Button>
          </div>
          {loading ? <Skeleton className="h-56" /> : combined.recent.length === 0 ? <EmptyState msg="ยังไม่มีงาน" icon="inbox" /> : (
            <div className="space-y-2">
              {combined.recent.map((r) => (
                <div key={r.id} className="flex items-center gap-2.5 border-b border-line/60 pb-2 text-[13px] last:border-0 dark:border-slate-800/60">
                  <span className={cn("rounded-full px-2 py-0.5 text-[10.5px] font-semibold", r.department === "admin" ? "bg-brand-600/10 text-brand-600" : "bg-teal/10 text-teal")}>{r.department === "admin" ? "Admin" : "เอกสาร"}</span>
                  <span className="min-w-0 flex-1 truncate font-semibold" title={r.companyName}>{r.companyName || "—"}</span>
                  <StatusChip raw={r.actualStatus} group={r.statusGroup} />
                  <span className="tnum text-[11px] text-muted">{r.workDate ?? ""}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </motion.div>
  );
}
