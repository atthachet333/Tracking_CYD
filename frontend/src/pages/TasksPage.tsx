import { ListTodo, ShieldCheck, Files } from "lucide-react";
import { useUnifiedTasks } from "@/hooks/useUnifiedTasks";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { UnifiedTasksTable } from "@/components/tasks/UnifiedTasksTable";
import { Card, PageHeader, SectionTitle, Skeleton } from "@/components/ui/primitives";

export function TasksPage() {
  const summary = useUnifiedTasks({ pageSize: 1 });
  const s = summary.data?.summary;

  return (
    <div>
      <PageHeader
        title="งานทั้งหมด"
        subtitle="งานติดตามลูกค้า (Admin) และงานแผนกเอกสาร รวมในที่เดียว จาก Google Sheets"
      />

      {summary.isLoading || !s ? (
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3"><Skeleton className="h-[122px]" /><Skeleton className="h-[122px]" /><Skeleton className="h-[122px]" /></div>
      ) : (
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard label="งานทั้งหมด (Admin + เอกสาร)" value={s.all} icon={ListTodo} color="blue" feature />
          <KpiCard label="งาน Admin" value={s.admin} icon={ShieldCheck} color="purple" />
          <KpiCard label="งานแผนกเอกสาร" value={s.documents} icon={Files} color="teal" />
        </div>
      )}

      <Card className="p-5">
        <SectionTitle title="รายการงานทั้งหมด" sub="กรองแผนก/สถานะ/ผู้รับผิดชอบ · ค้นหา · เรียง · Export CSV · คลิกบริษัทดูรายละเอียด" />
        <UnifiedTasksTable />
      </Card>
    </div>
  );
}
