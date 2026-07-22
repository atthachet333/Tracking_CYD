import { useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, ArrowRight, Users, Briefcase, Activity, CheckCircle2, TriangleAlert, HelpCircle, UserCheck, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  useAdminSummary, useAdminDistribution, useAdminAssignees, useAdminCompanies, useAdminRecent, useRefreshAdminDashboard,
} from "@/hooks/useAdminDashboard";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { CustomerStatusDonut } from "@/components/customer-dashboard/CustomerStatusDonut";
import { ActualStatusBarChart } from "@/components/customer-dashboard/ActualStatusBarChart";
import { CustomerInsights } from "@/components/customer-dashboard/CustomerInsights";
import { StatusChip } from "@/components/customer-dashboard/StatusChip";
import { DocumentsAssigneesTable } from "@/components/documents-dashboard/DocumentsAssigneesTable";
import { DocumentsCompaniesTable } from "@/components/documents-dashboard/DocumentsCompaniesTable";
import { Card, PageHeader, SectionTitle, Button, Skeleton, ErrorState, EmptyState, Avatar } from "@/components/ui/primitives";
import { useUiStore } from "@/stores/uiStore";
import { cn } from "@/lib/utils";

export function AdminOverviewPage() {
  const navigate = useNavigate();
  const summary = useAdminSummary();
  const distribution = useAdminDistribution();
  const assignees = useAdminAssignees();
  const companies = useAdminCompanies();
  const recent = useAdminRecent();
  const refresh = useRefreshAdminDashboard();
  const pushToast = useUiStore((s) => s.pushToast);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const s = summary.data?.data;

  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
      pushToast({ title: "รีเฟรชสำเร็จ", desc: "ดึงข้อมูลแอดมินล่าสุดจาก Google Sheets", type: "success" });
    } catch (e) {
      pushToast({ title: "รีเฟรชไม่สำเร็จ", desc: (e as Error).message, type: "error" });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <PageHeader
        title="ภาพรวมแอดมิน"
        subtitle="สรุปลูกค้า เคส ผู้รับผิดชอบ และผลการติดตามของทีมแอดมิน"
        actions={
          <>
            <Button onClick={() => navigate("/dashboard/tasks?department=admin")}>ดูงานทั้งหมด <ArrowRight className="h-4 w-4" /></Button>
            <Button variant="primary" onClick={onRefresh} className={cn(isRefreshing && "opacity-70")}><RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} /> รีเฟรช</Button>
          </>
        }
      />

      {/* KPI */}
      {summary.isError ? (
        <Card className="mb-4 p-6"><ErrorState message="โหลดสรุปแอดมินไม่สำเร็จ" onRetry={() => summary.refetch()} /></Card>
      ) : summary.isLoading || !s ? (
        <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4"><Skeleton className="h-[122px]" /><Skeleton className="h-[122px]" /><Skeleton className="h-[122px]" /><Skeleton className="h-[122px]" /></div>
      ) : (
        <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-4">
          <KpiCard label="ลูกค้าทั้งหมด" value={s.uniqueCompanies} icon={Users} color="blue" feature note={`เคสไม่ซ้ำ ${s.uniqueCases}`} />
          <KpiCard label="เคสทั้งหมด" value={s.totalCustomers} icon={Briefcase} color="purple" onClick={() => navigate("/dashboard/tasks?department=admin")} />
          <KpiCard label="กำลังดำเนินการ" value={s.inProgress} icon={Activity} color="amber" onClick={() => navigate("/dashboard/tasks?department=admin&statusGroup=in_progress")} />
          <KpiCard label="ปิดเคสสำเร็จ" value={s.completed} icon={CheckCircle2} color="green" note={`${s.completionRate}%`} onClick={() => navigate("/dashboard/tasks?department=admin&statusGroup=completed")} />
          <KpiCard label="เคสที่มีปัญหา" value={s.issues} icon={TriangleAlert} color="red" note={`${s.issueRate}%`} onClick={() => navigate("/dashboard/tasks?department=admin&statusGroup=issues")} />
          <KpiCard label="ยังไม่ระบุสถานะ" value={s.unclassified} icon={HelpCircle} color="teal" />
          <KpiCard label="พนักงานที่รับผิดชอบ" value={assignees.data?.data.length ?? 0} icon={UserCheck} color="blue" />
          <KpiCard label="บริษัทที่ดูแล" value={s.uniqueCompanies} icon={Building2} color="teal" />
        </div>
      )}

      {/* Charts */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <SectionTitle title="สัดส่วนสถานะลูกค้า" />
          {distribution.isLoading ? <Skeleton className="h-60" /> : distribution.isError ? <ErrorState message="โหลดไม่สำเร็จ" onRetry={() => distribution.refetch()} /> : <CustomerStatusDonut data={distribution.data?.data ?? []} />}
        </Card>
        <Card className="p-5">
          <SectionTitle title="จำนวนเคสตามสถานะจริง" />
          {distribution.isLoading ? <Skeleton className="h-60" /> : <ActualStatusBarChart data={distribution.data?.actual ?? []} />}
        </Card>
      </div>

      {/* Assignees + Companies */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <SectionTitle title="สรุปผู้รับผิดชอบ" />
          {assignees.isLoading ? <Skeleton className="h-56" /> : assignees.isError ? <ErrorState message="โหลดไม่สำเร็จ" onRetry={() => assignees.refetch()} /> : <DocumentsAssigneesTable data={assignees.data?.data ?? []} />}
        </Card>
        <Card className="p-5">
          <SectionTitle title="บริษัทที่ติดต่อทั้งหมด" />
          {companies.isLoading ? <Skeleton className="h-56" /> : companies.isError ? <ErrorState message="โหลดไม่สำเร็จ" onRetry={() => companies.refetch()} /> : <DocumentsCompaniesTable data={(companies.data?.data ?? []).slice(0, 20)} />}
        </Card>
      </div>

      {/* Recent + Insights */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <SectionTitle title="เคสล่าสุด" />
            <Button onClick={() => navigate("/dashboard/tasks?department=admin")}>ดูงานทั้งหมด <ArrowRight className="h-4 w-4" /></Button>
          </div>
          {recent.isLoading ? <Skeleton className="h-64" /> : recent.isError ? <ErrorState message="โหลดไม่สำเร็จ" onRetry={() => recent.refetch()} /> : (recent.data?.data.length ?? 0) === 0 ? <EmptyState msg="ยังไม่มีเคส" icon="inbox" /> : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-line dark:border-slate-800">
                    {["วันที่", "รหัสเคส", "ชื่อบริษัท", "ผู้รับผิดชอบ", "สถานะลูกค้า", "ติดตามล่าสุด"].map((h) => (
                      <th key={h} className="whitespace-nowrap px-3 py-2.5 text-left text-[11.5px] font-semibold uppercase tracking-wide text-muted">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(recent.data?.data ?? []).slice(0, 12).map((c, i) => (
                    <tr key={`${c.sourceRow}-${i}`} className="border-b border-line/60 hover:bg-surface dark:border-slate-800/60 dark:hover:bg-slate-800/40">
                      <td className="whitespace-nowrap px-3 py-2.5 tnum text-muted">{c.date ?? "—"}</td>
                      <td className="px-3 py-2.5 tnum font-semibold">{c.caseNo || "—"}</td>
                      <td className="max-w-[220px] truncate px-3 py-2.5" title={c.company}>{c.company || "—"}</td>
                      <td className="px-3 py-2.5"><div className="flex items-center gap-1.5"><Avatar name={c.assignee || "?"} size={24} /><span>{c.assignee || "—"}</span></div></td>
                      <td className="px-3 py-2.5"><StatusChip raw={c.customerStatus} group={c.statusGroup} /></td>
                      <td className="max-w-[200px] truncate px-3 py-2.5 text-muted" title={c.latestFollowUp}>{c.latestFollowUp || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        <Card className="border-brand-600/10 bg-gradient-to-br from-brand-600/[.05] to-purple/[.04] p-5">
          <SectionTitle title="Insight & Recommendation" />
          {summary.isLoading ? <Skeleton className="h-40" /> : <CustomerInsights insights={summary.data?.insights ?? []} />}
        </Card>
      </div>
    </motion.div>
  );
}
