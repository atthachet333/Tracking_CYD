import { useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, ArrowRight, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  useDocumentsSummary, useDocumentsDistribution, useDocumentsPayment, useDocumentsAssignees,
  useDocumentsCompanies, useDocumentsRecent, useRefreshDocumentsDashboard,
} from "@/hooks/useDocumentsDashboard";
import { DocumentsKpiCards } from "@/components/documents-dashboard/DocumentsKpiCards";
import { DocumentsPaymentChart } from "@/components/documents-dashboard/DocumentsPaymentChart";
import { DocumentsWorkloadChart } from "@/components/documents-dashboard/DocumentsWorkloadChart";
import { DocumentsAssigneesTable } from "@/components/documents-dashboard/DocumentsAssigneesTable";
import { DocumentsCompaniesTable } from "@/components/documents-dashboard/DocumentsCompaniesTable";
import { DocumentsRecentItems } from "@/components/documents-dashboard/DocumentsRecentItems";
import { CustomerStatusDonut } from "@/components/customer-dashboard/CustomerStatusDonut";
import { ActualStatusBarChart } from "@/components/customer-dashboard/ActualStatusBarChart";
import { CustomerInsights } from "@/components/customer-dashboard/CustomerInsights";
import { sheet1Url } from "@/services/sheets-api";
import { Card, PageHeader, SectionTitle, Button, Skeleton, ErrorState } from "@/components/ui/primitives";
import { useUiStore } from "@/stores/uiStore";
import { cn } from "@/lib/utils";

export function DocumentsOverviewPage() {
  const navigate = useNavigate();
  const summary = useDocumentsSummary();
  const distribution = useDocumentsDistribution();
  const payment = useDocumentsPayment();
  const assignees = useDocumentsAssignees();
  const companies = useDocumentsCompanies();
  const recent = useDocumentsRecent();
  const refresh = useRefreshDocumentsDashboard();
  const pushToast = useUiStore((s) => s.pushToast);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const meta = summary.data?.meta;
  const docsUrl = sheet1Url(meta?.spreadsheetId ?? null); // ปลายทางเดียวกับ Sheet 1

  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
      pushToast({ title: "รีเฟรชสำเร็จ", desc: "ดึงข้อมูลแผนกเอกสารล่าสุด", type: "success" });
    } catch (e) {
      pushToast({ title: "รีเฟรชไม่สำเร็จ", desc: (e as Error).message, type: "error" });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <PageHeader
        title="ภาพรวมแผนกเอกสาร"
        subtitle="สรุปงาน บริษัท ผู้รับผิดชอบ และสถานะการดำเนินงานของแผนกเอกสาร"
        actions={
          <>
            {docsUrl && (
              <a href={docsUrl} target="_blank" rel="noopener noreferrer"><Button><ExternalLink className="h-4 w-4" /> เปิด Google Sheet</Button></a>
            )}
            <Button onClick={() => navigate("/dashboard/tasks?department=documents")}>ดูงานทั้งหมด <ArrowRight className="h-4 w-4" /></Button>
            <Button variant="primary" onClick={onRefresh} className={cn(isRefreshing && "opacity-70")}>
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} /> รีเฟรช
            </Button>
          </>
        }
      />

      {/* KPI */}
      <DocumentsKpiCards
        summary={summary.data?.data}
        isLoading={summary.isLoading}
        isError={summary.isError}
        onRetry={() => summary.refetch()}
        onSelectGroup={(g) => navigate(`/dashboard/tasks?department=documents&statusGroup=${g}`)}
      />

      {meta && meta.warnings.length > 0 && (
        <div className="mb-4 space-y-1.5">
          {meta.warnings.map((w, i) => (
            <div key={i} className="rounded-lg bg-warning/10 px-3 py-2 text-[12px] text-amber-700 dark:text-amber-400">⚠ {w}</div>
          ))}
        </div>
      )}

      {/* Charts: สถานะงาน + สถานะการชำระ + Workload */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <SectionTitle title="สัดส่วนสถานะงาน" />
          {distribution.isLoading ? <Skeleton className="h-60" /> : distribution.isError ? <ErrorState message="โหลดไม่สำเร็จ" onRetry={() => distribution.refetch()} /> : <CustomerStatusDonut data={distribution.data?.data ?? []} />}
        </Card>
        <Card className="p-5">
          <SectionTitle title="สัดส่วนสถานะการชำระ" />
          {payment.isLoading ? <Skeleton className="h-60" /> : payment.isError ? <ErrorState message="โหลดไม่สำเร็จ" onRetry={() => payment.refetch()} /> : <DocumentsPaymentChart data={payment.data?.data ?? []} />}
        </Card>
        <Card className="p-5">
          <SectionTitle title="งานตามผู้รับผิดชอบ" sub="Workload" />
          {assignees.isLoading ? <Skeleton className="h-60" /> : assignees.isError ? <ErrorState message="โหลดไม่สำเร็จ" onRetry={() => assignees.refetch()} /> : <DocumentsWorkloadChart data={assignees.data?.data ?? []} />}
        </Card>
      </div>

      {/* Actual statuses + assignees table */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <SectionTitle title="จำนวนตามสถานะจริง" />
          {distribution.isLoading ? <Skeleton className="h-56" /> : <ActualStatusBarChart data={distribution.data?.actual ?? []} />}
        </Card>
        <Card className="p-5">
          <SectionTitle title="สรุปผู้รับผิดชอบ" />
          {assignees.isLoading ? <Skeleton className="h-56" /> : <DocumentsAssigneesTable data={assignees.data?.data ?? []} showPayment />}
        </Card>
      </div>

      {/* Companies */}
      <Card className="mb-4 p-5">
        <SectionTitle title="บริษัทที่อยู่ในการดูแล" />
        {companies.isLoading ? <Skeleton className="h-40" /> : companies.isError ? <ErrorState message="โหลดไม่สำเร็จ" onRetry={() => companies.refetch()} /> : <DocumentsCompaniesTable data={companies.data?.data ?? []} showPayment />}
      </Card>

      {/* Recent + insights */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-3.5 flex items-center justify-between">
            <SectionTitle title="งานล่าสุด" />
            <Button onClick={() => navigate("/dashboard/tasks?department=documents")}>ดูงานทั้งหมด <ArrowRight className="h-4 w-4" /></Button>
          </div>
          {recent.isLoading ? <Skeleton className="h-64" /> : recent.isError ? <ErrorState message="โหลดไม่สำเร็จ" onRetry={() => recent.refetch()} /> : <DocumentsRecentItems items={recent.data?.data ?? []} limit={15} />}
        </Card>
        <Card className="border-brand-600/10 bg-gradient-to-br from-brand-600/[.05] to-purple/[.04] p-5">
          <SectionTitle title="Insight & Recommendation" />
          {summary.isLoading ? <Skeleton className="h-40" /> : <CustomerInsights insights={summary.data?.insights ?? []} />}
        </Card>
      </div>
    </motion.div>
  );
}
