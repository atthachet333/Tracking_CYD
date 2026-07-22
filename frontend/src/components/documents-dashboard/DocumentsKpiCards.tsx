import { FileText, Activity, CheckCircle2, TriangleAlert, Building2, Users, Clock, Wallet } from "lucide-react";
import type { DocumentsSummary } from "@/types/documents-dashboard";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Skeleton, ErrorState } from "@/components/ui/primitives";

interface Props {
  summary?: DocumentsSummary;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onSelectGroup?: (g: "in_progress" | "completed" | "issues") => void;
}

/** KPI 6 ใบของแผนกเอกสาร */
export function DocumentsKpiCards({ summary, isLoading, isError, onRetry, onSelectGroup }: Props) {
  if (isError) return <div className="surface-card mb-4 p-4"><ErrorState message="โหลดสรุปงานเอกสารไม่สำเร็จ" onRetry={onRetry} /></div>;
  if (isLoading || !summary) {
    return (
      <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-[122px]" />)}
      </div>
    );
  }
  const s = summary;
  return (
    <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-4">
      <KpiCard label="งานเอกสารทั้งหมด" value={s.totalItems} icon={FileText} color="teal" feature />
      <KpiCard label="กำลังดำเนินการ" value={s.inProgress} icon={Activity} color="amber" onClick={() => onSelectGroup?.("in_progress")} />
      <KpiCard label="งานเสร็จสิ้น" value={s.completed} icon={CheckCircle2} color="green" note={`${s.completionRate}%`} onClick={() => onSelectGroup?.("completed")} />
      <KpiCard label="งานที่มีปัญหา" value={s.issues} icon={TriangleAlert} color="red" note={`${s.issueRate}%`} onClick={() => onSelectGroup?.("issues")} />
      <KpiCard label="บริษัททั้งหมด" value={s.uniqueCompanies} icon={Building2} color="blue" />
      <KpiCard label="ผู้รับผิดชอบ" value={s.totalEmployees} icon={Users} color="purple" />
      <KpiCard label="รอชำระ" value={s.pendingPayment} icon={Clock} color="amber" />
      <KpiCard label="ชำระเรียบร้อย" value={s.paidPayment} icon={Wallet} color="teal" />
    </div>
  );
}
