import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ComposedChart, Area, Line,
} from "recharts";
import { useCustomerSummary, useCustomerDistribution, useCustomerTrends, useCustomersList } from "@/hooks/useCustomerDashboard";
import type { CustomerStatusGroup } from "@/types/customer-dashboard";
import { CustomerStatusDonut } from "@/components/customer-dashboard/CustomerStatusDonut";
import { ActualStatusBarChart } from "@/components/customer-dashboard/ActualStatusBarChart";
import { CustomerTable } from "@/components/customer-dashboard/CustomerTable";
import { GROUP_META } from "@/components/customer-dashboard/groups";
import { Card, PageHeader, SectionTitle, EmptyState, ErrorState, Skeleton, Button } from "@/components/ui/primitives";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { downloadCsv } from "@/lib/csv";

const tooltipStyle = { borderRadius: 12, border: "1px solid rgba(148,163,184,.3)", fontSize: 13, fontFamily: "IBM Plex Sans Thai", background: "#0f1728", color: "#e2e8f0" };
const AXIS = { fontSize: 12, fontFamily: "IBM Plex Sans Thai", fill: "#94a3b8" };
const GROUPS: CustomerStatusGroup[] = ["completed", "in_progress", "issues", "unclassified"];

function StatTile({ label, value, suffix, color }: { label: string; value: number; suffix?: string; color: string }) {
  return (
    <div className="surface-card p-4">
      <div className="text-[12px] text-muted">{label}</div>
      <div className="mt-1 text-[24px] font-extrabold tracking-tight" style={{ color }}>
        <AnimatedNumber value={value} suffix={suffix} decimals={suffix === "%" ? 2 : 0} />
      </div>
    </div>
  );
}

export function ReportsPage() {
  const summary = useCustomerSummary();
  const distribution = useCustomerDistribution();
  const trends = useCustomerTrends();
  const all = useCustomersList({ pageSize: 500 });
  const [statusGroup, setStatusGroup] = useState<CustomerStatusGroup | "all" | null>(null);

  const s = summary.data?.data;
  const rows = useMemo(() => all.data?.data ?? [], [all.data?.data]);

  // Stacked bar: จำนวนตามผู้รับผิดชอบ × กลุ่มสถานะ
  const byAssignee = useMemo(() => {
    const map = new Map<string, Record<string, number | string>>();
    for (const r of rows) {
      const a = r.assignee || "ไม่ระบุ";
      const cur = map.get(a) ?? { assignee: a, completed: 0, in_progress: 0, issues: 0, unclassified: 0 };
      cur[r.statusGroup] = (cur[r.statusGroup] as number) + 1;
      map.set(a, cur);
    }
    return [...map.values()];
  }, [rows]);

  const trendData = trends.data?.data ?? [];

  const exportCsv = () => {
    downloadCsv("customer-report", [
      { key: "no", label: "ลำดับ" },
      { key: "date", label: "วันที่" }, { key: "caseNo", label: "รหัสเคส" }, { key: "company", label: "ชื่อบริษัท" },
      { key: "assignee", label: "ผู้รับผิดชอบ" }, { key: "customerStatus", label: "สถานะลูกค้า" }, { key: "statusGroup", label: "กลุ่ม" },
    ], rows.map((r, i) => ({ no: i + 1, ...r })));
  };

  return (
    <div>
      <PageHeader
        title="รายงานและวิเคราะห์ (Reports & Analytics)"
        subtitle="วิเคราะห์จากสถานะลูกค้า (Google Sheets): สัดส่วนกลุ่ม สถานะจริง แนวโน้ม และรายผู้รับผิดชอบ"
        actions={<Button onClick={exportCsv} className={rows.length === 0 ? "pointer-events-none opacity-50" : ""}><Download className="h-4 w-4" /> Export CSV</Button>}
      />

      {/* KPI + rates */}
      {summary.isError ? (
        <Card className="mb-4 p-6"><ErrorState message="โหลดสรุปไม่สำเร็จ" onRetry={() => summary.refetch()} /></Card>
      ) : summary.isLoading || !s ? (
        <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile label="ลูกค้าทั้งหมด" value={s.totalCustomers} color="#1D4ED8" />
            <StatTile label="ปิดเคสสำเร็จ" value={s.completed} color={GROUP_META.completed.color} />
            <StatTile label="เคสที่มีปัญหา" value={s.issues} color={GROUP_META.issues.color} />
            <StatTile label="กำลังดำเนินการ" value={s.inProgress} color={GROUP_META.in_progress.color} />
          </div>
          <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile label="Completion Rate" value={s.completionRate} suffix="%" color={GROUP_META.completed.color} />
            <StatTile label="Issue Rate" value={s.issueRate} suffix="%" color={GROUP_META.issues.color} />
            <StatTile label="In Progress Rate" value={s.inProgressRate} suffix="%" color={GROUP_META.in_progress.color} />
            <StatTile label="ยังไม่ระบุสถานะ" value={s.unclassified} color="#94A3B8" />
          </div>
        </>
      )}

      {/* Donut + Actual */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <SectionTitle title="สัดส่วนกลุ่มสถานะ" />
          {distribution.isLoading ? <Skeleton className="h-60" /> : distribution.isError ? <ErrorState message="โหลดไม่สำเร็จ" onRetry={() => distribution.refetch()} /> : <CustomerStatusDonut data={distribution.data?.data ?? []} />}
        </Card>
        <Card className="p-5">
          <SectionTitle title="จำนวนตามสถานะจริง (Top)" />
          {distribution.isLoading ? <Skeleton className="h-60" /> : distribution.isError ? <ErrorState message="โหลดไม่สำเร็จ" onRetry={() => distribution.refetch()} /> : <ActualStatusBarChart data={distribution.data?.actual ?? []} />}
        </Card>
      </div>

      {/* Stacked by assignee + Trend */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <SectionTitle title="สถานะแยกตามผู้รับผิดชอบ" sub="stacked" />
          {all.isLoading ? <Skeleton className="h-64" /> : byAssignee.length === 0 ? <EmptyState msg="ไม่มีข้อมูล" /> : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={byAssignee}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,.15)" vertical={false} />
                <XAxis dataKey="assignee" tick={{ ...AXIS, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontFamily: "IBM Plex Sans Thai" }} />
                {GROUPS.map((g) => <Bar key={g} dataKey={g} name={GROUP_META[g].label} stackId="s" fill={GROUP_META[g].color} maxBarSize={40} radius={g === "unclassified" ? [4, 4, 0, 0] : undefined} />)}
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
        <Card className="p-5">
          <SectionTitle title="แนวโน้มรายเดือน" sub="จากวันที่จริง" />
          {trends.isLoading ? <Skeleton className="h-64" /> : trendData.length === 0 ? <EmptyState msg="ยังไม่มีข้อมูลวันที่เพียงพอสำหรับแนวโน้ม" /> : (
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={trendData}>
                <defs><linearGradient id="rgTotal" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1D4ED8" stopOpacity={0.35} /><stop offset="100%" stopColor="#1D4ED8" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,.15)" vertical={false} />
                <XAxis dataKey="period" tick={AXIS} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontFamily: "IBM Plex Sans Thai" }} />
                <Area type="monotone" dataKey="total" name="ทั้งหมด" stroke="#1D4ED8" strokeWidth={2} fill="url(#rgTotal)" />
                <Line type="monotone" dataKey="completed" name="ปิดสำเร็จ" stroke={GROUP_META.completed.color} strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="issues" name="มีปัญหา" stroke={GROUP_META.issues.color} strokeWidth={2.5} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Detailed table */}
      <Card className="p-5">
        <SectionTitle title="ตารางรายละเอียดทั้งหมด (แยกตามสถานะได้)" />
        <CustomerTable statusGroup={statusGroup} onStatusGroupChange={setStatusGroup} />
      </Card>
    </div>
  );
}
