import { useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Filter, X } from "lucide-react";
import {
  ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import {
  useCustomerSummary, useCustomerDistribution, useCustomerRecentCases, useCustomerTrends, useRefreshCustomerDashboard,
} from "@/hooks/useCustomerDashboard";
import type { CustomerStatusGroup } from "@/types/customer-dashboard";
import { CustomerKpiCards } from "@/components/customer-dashboard/CustomerKpiCards";
import { CustomerStatusDonut } from "@/components/customer-dashboard/CustomerStatusDonut";
import { ActualStatusBarChart } from "@/components/customer-dashboard/ActualStatusBarChart";
import { RecentCasesTable } from "@/components/customer-dashboard/RecentCasesTable";
import { ProblemCasesPanel } from "@/components/customer-dashboard/ProblemCasesPanel";
import { CustomerInsights } from "@/components/customer-dashboard/CustomerInsights";
import { DataSourceStatus } from "@/components/customer-dashboard/DataSourceStatus";
import { GROUP_META } from "@/components/customer-dashboard/groups";
import { Card, PageHeader, SectionTitle, Button, Skeleton, ErrorState, EmptyState } from "@/components/ui/primitives";
import { useUiStore } from "@/stores/uiStore";
import { cn } from "@/lib/utils";

type FocusGroup = CustomerStatusGroup | "all";

const tooltipStyle = { borderRadius: 12, border: "1px solid rgba(148,163,184,.3)", fontSize: 13, fontFamily: "IBM Plex Sans Thai", background: "#0f1728", color: "#e2e8f0" };
const AXIS = { fontSize: 12, fontFamily: "IBM Plex Sans Thai", fill: "#94a3b8" };

export function CustomerOverviewPage() {
  const summary = useCustomerSummary();
  const distribution = useCustomerDistribution();
  const recent = useCustomerRecentCases();
  const trends = useCustomerTrends();
  const refresh = useRefreshCustomerDashboard();
  const pushToast = useUiStore((s) => s.pushToast);

  const [active, setActive] = useState<FocusGroup | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const meta = summary.data?.meta ?? distribution.data?.meta ?? recent.data?.meta;

  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
      pushToast({ title: "รีเฟรชสำเร็จ", desc: "ดึงข้อมูลลูกค้าล่าสุดจาก Google Sheets", type: "success" });
    } catch (e) {
      pushToast({ title: "รีเฟรชไม่สำเร็จ", desc: (e as Error).message, type: "error" });
    } finally {
      setIsRefreshing(false);
    }
  };

  const onSelect = (g: FocusGroup) => setActive((cur) => (cur === g ? null : g));

  const trendData = trends.data?.data ?? [];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <PageHeader
        title="ภาพรวมลูกค้าและสถานะเคส"
        subtitle="สรุปจำนวนลูกค้า สถานะการดำเนินงาน และเคสที่ต้องติดตามจากข้อมูล Google Sheets"
        actions={
          <Button variant="primary" onClick={onRefresh} className={cn(isRefreshing && "opacity-70")}>
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} /> รีเฟรชข้อมูล
          </Button>
        }
      />

      <CustomerKpiCards
        summary={summary.data?.data}
        isLoading={summary.isLoading}
        isError={summary.isError}
        onRetry={() => summary.refetch()}
        active={active}
        onSelect={onSelect}
      />

      {/* Charts */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <SectionTitle title="สัดส่วนสถานะลูกค้า" sub="ตามกลุ่มที่จัดหมวด" />
          {distribution.isLoading ? <Skeleton className="h-60" />
            : distribution.isError ? <ErrorState message="โหลดสัดส่วนไม่สำเร็จ" onRetry={() => distribution.refetch()} />
            : <CustomerStatusDonut data={distribution.data?.data ?? []} />}
        </Card>

        <Card className="p-5">
          <SectionTitle title="จำนวนเคสตามสถานะจริง" sub="ค่าที่บันทึกในชีต" />
          {distribution.isLoading ? <Skeleton className="h-60" />
            : distribution.isError ? <ErrorState message="โหลดข้อมูลไม่สำเร็จ" onRetry={() => distribution.refetch()} />
            : <ActualStatusBarChart data={distribution.data?.actual ?? []} />}
        </Card>
      </div>

      {/* Recent + Insights */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
            <SectionTitle title="เคสที่อัปเดตล่าสุด" />
            {active && (
              <button onClick={() => setActive(null)} className="inline-flex items-center gap-1.5 rounded-full bg-brand-600/10 px-2.5 py-1 text-[12px] font-semibold text-brand-600">
                <Filter className="h-3.5 w-3.5" />
                {active === "all" ? "ทั้งหมด" : GROUP_META[active].label}
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {recent.isLoading ? <Skeleton className="h-72" />
            : recent.isError ? <ErrorState message="โหลดเคสล่าสุดไม่สำเร็จ" onRetry={() => recent.refetch()} />
            : <RecentCasesTable cases={recent.data?.data ?? []} filter={active} />}
        </Card>

        <Card className="p-5">
          <SectionTitle title="Executive Insight" sub="วิเคราะห์อัตโนมัติ" />
          {summary.isLoading ? <Skeleton className="h-40" />
            : summary.isError ? <ErrorState message="โหลด insight ไม่สำเร็จ" onRetry={() => summary.refetch()} />
            : <CustomerInsights insights={summary.data?.insights ?? []} />}
        </Card>
      </div>

      {/* Trend + Data source */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <SectionTitle title="แนวโน้มรายเดือน" sub="จำนวนเคส / ปิดสำเร็จ / มีปัญหา" />
          {trends.isLoading ? <Skeleton className="h-64" />
            : trends.isError ? <ErrorState message="โหลดแนวโน้มไม่สำเร็จ" onRetry={() => trends.refetch()} />
            : trendData.length === 0 ? <EmptyState msg="ยังไม่มีข้อมูลวันที่เพียงพอสำหรับแนวโน้ม" icon="database" />
            : (
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={trendData}>
                  <defs>
                    <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1D4ED8" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#1D4ED8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,.15)" vertical={false} />
                  <XAxis dataKey="period" tick={AXIS} axisLine={false} tickLine={false} />
                  <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontFamily: "IBM Plex Sans Thai" }} />
                  <Area type="monotone" dataKey="total" name="เคสทั้งหมด" stroke="#1D4ED8" strokeWidth={2} fill="url(#gTotal)" />
                  <Line type="monotone" dataKey="completed" name="ปิดสำเร็จ" stroke={GROUP_META.completed.color} strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="issues" name="มีปัญหา" stroke={GROUP_META.issues.color} strokeWidth={2.5} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
        </Card>

        <Card className="p-5">
          <SectionTitle title="แหล่งข้อมูล" />
          <DataSourceStatus meta={meta} isRefreshing={isRefreshing} onRefresh={onRefresh} />
        </Card>
      </div>

      {/* Problem cases */}
      <Card className="p-5">
        <SectionTitle title="เคสที่ต้องติดตามเร่งด่วน" sub="กลุ่มเคสที่มีปัญหา" />
        <ProblemCasesPanel />
      </Card>
    </motion.div>
  );
}
