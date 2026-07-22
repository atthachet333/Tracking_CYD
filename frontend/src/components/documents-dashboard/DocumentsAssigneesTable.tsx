import type { DocumentsAssigneeStat } from "@/types/documents-dashboard";
import { EmptyState, Avatar } from "@/components/ui/primitives";
import { WORKLOAD_META } from "./workload";
import { cn } from "@/lib/utils";

export function DocumentsAssigneesTable({ data, showPayment = false }: { data: DocumentsAssigneeStat[]; showPayment?: boolean }) {
  if (!data.length) return <EmptyState msg="ยังไม่มีข้อมูลผู้รับผิดชอบ" icon="inbox" />;
  const cols = ["พนักงาน", "งานทั้งหมด", "กำลังดำเนินการ", "เสร็จสิ้น", "มีปัญหา", ...(showPayment ? ["รอชำระ"] : []), "บริษัท", "ภาระงาน", "งานล่าสุด"];
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-line dark:border-slate-800">
            {cols.map((h, i) => (
              <th key={h} className={cn("px-3 py-2.5 text-[11.5px] font-semibold uppercase tracking-wide text-muted", i === 0 ? "text-left" : "text-center")}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((a) => (
            <tr key={a.assignee} className="border-b border-line/60 hover:bg-surface dark:border-slate-800/60 dark:hover:bg-slate-800/40">
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <Avatar name={a.assignee || "?"} size={28} />
                  <span className="font-semibold">{a.assignee}</span>
                </div>
              </td>
              <td className="px-3 py-2.5 text-center tnum font-semibold">{a.total}</td>
              <td className="px-3 py-2.5 text-center tnum text-warning">{a.inProgress}</td>
              <td className="px-3 py-2.5 text-center tnum text-success">{a.completed}</td>
              <td className="px-3 py-2.5 text-center tnum text-danger">{a.issues}</td>
              {showPayment && <td className="px-3 py-2.5 text-center tnum text-amber-600">{a.pendingPayment}</td>}
              <td className="px-3 py-2.5 text-center tnum">{a.companies}</td>
              <td className="px-3 py-2.5 text-center">
                <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold", WORKLOAD_META[a.workloadLevel].chip)}>
                  {WORKLOAD_META[a.workloadLevel].label}
                </span>
              </td>
              <td className="px-3 py-2.5 text-center tnum text-muted">{a.latestDate ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
