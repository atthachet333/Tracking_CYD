import { useState } from "react";
import { FileText, Clock, CheckCircle2, RotateCcw } from "lucide-react";
import { useDocuments } from "@/hooks/useApi";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Card, PageHeader, SectionTitle, EmptyState, ErrorState, Skeleton, StatusBadge, TagSoft } from "@/components/ui/primitives";
import { avatarUrl } from "@/lib/utils";

export function DocumentsPage() {
  const { data, isLoading, isError, error, refetch } = useDocuments({ pageSize: 200 });
  const [status, setStatus] = useState("all");
  const docs = data?.data ?? [];
  const filtered = status === "all" ? docs : docs.filter((d) => d.status === status);

  const counts = {
    total: docs.length,
    wait: docs.filter((d) => d.status === "wait").length,
    done: docs.filter((d) => d.status === "done").length,
    back: docs.filter((d) => d.status === "back").length,
  };

  return (
    <div>
      <PageHeader title="ศูนย์จัดการงานเอกสาร" subtitle="รายการเอกสารทั้งหมด สถานะ ผู้จัดทำ และความครบถ้วน" />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="เอกสารทั้งหมด" value={counts.total} icon={FileText} color="blue" />
        <KpiCard label="รอดำเนินการ" value={counts.wait} icon={Clock} color="amber" />
        <KpiCard label="อนุมัติแล้ว" value={counts.done} icon={CheckCircle2} color="green" />
        <KpiCard label="ตีกลับ" value={counts.back} icon={RotateCcw} color="red" />
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <SectionTitle title="รายการเอกสาร" />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 rounded-lg border border-line bg-white px-3 text-[13px] dark:border-slate-700 dark:bg-[#0f1728]">
            <option value="all">สถานะ: ทั้งหมด</option>
            <option value="wait">รอดำเนินการ</option>
            <option value="done">อนุมัติแล้ว</option>
            <option value="back">ตีกลับ</option>
          </select>
        </div>

        {isLoading ? (
          <Skeleton className="h-64" />
        ) : isError ? (
          <ErrorState message={(error as Error)?.message ?? "โหลดเอกสารไม่สำเร็จ"} onRetry={() => refetch()} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-line dark:border-slate-800">
                  {["รหัส", "ชื่อเอกสาร", "ประเภท", "ผู้จัดทำ", "Checklist", "สถานะ"].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left text-[11.5px] font-semibold uppercase tracking-wide text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6}><EmptyState msg="ไม่พบเอกสาร" icon="inbox" /></td></tr>
                ) : (
                  filtered.map((d) => (
                    <tr key={d.id} className="border-b border-line/60 hover:bg-surface dark:border-slate-800/60 dark:hover:bg-slate-800/40">
                      <td className="px-3 py-2.5 tnum text-[13px] font-semibold">{d.id}</td>
                      <td className="px-3 py-2.5 text-[13px] font-semibold">{d.title}</td>
                      <td className="px-3 py-2.5"><TagSoft>{d.type}</TagSoft></td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <img src={avatarUrl(d.img)} alt="" className="h-7 w-7 rounded-lg object-cover" />
                          <span className="text-[13px]">{d.owner.split(" ")[0]}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 tnum text-[13px]" style={{ color: d.checkDone === d.checklist ? "#16A34A" : "#F59E0B" }}>
                        {d.checkDone}/{d.checklist}
                      </td>
                      <td className="px-3 py-2.5"><StatusBadge status={d.status} text={d.statusText} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
