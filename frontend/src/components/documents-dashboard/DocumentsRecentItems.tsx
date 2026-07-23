import type { DocumentTaskItem } from "@/types/documents-dashboard";
import { EmptyState, Avatar } from "@/components/ui/primitives";
import { StatusChip } from "@/components/customer-dashboard/StatusChip";

const COLS = ["วันที่", "บริษัท", "ผู้รับผิดชอบ", "รายละเอียดเบื้องต้น", "สถานะการชำระ", "สถานะเคส"];

export function DocumentsRecentItems({ items, limit = 15 }: { items: DocumentTaskItem[]; limit?: number }) {
  const rows = items.slice(0, limit);
  if (rows.length === 0) return <EmptyState msg="ยังไม่มีงานเอกสาร" icon="inbox" />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-line dark:border-slate-800">
            {COLS.map((h) => <th key={h} className="whitespace-nowrap px-3 py-2.5 text-left text-[11.5px] font-semibold uppercase tracking-wide text-muted">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((it, i) => (
            <tr key={`${it.sourceRow}-${i}`} className="border-b border-line/60 hover:bg-surface dark:border-slate-800/60 dark:hover:bg-slate-800/40">
              <td className="whitespace-nowrap px-3 py-2.5 tnum text-muted">{it.workDate ?? "—"}</td>
              <td className="max-w-[220px] truncate px-3 py-2.5 font-semibold" title={it.company}>{it.company || "—"}</td>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <Avatar name={it.assignee || "?"} size={24} />
                  <span>{it.assignee || "—"}</span>
                </div>
              </td>
              <td className="line-clamp-2 max-w-[280px] px-3 py-2.5 text-muted" title={it.detail}>{it.detail || "—"}</td>
              <td className="max-w-[160px] truncate px-3 py-2.5" title={it.paymentStatus}>{it.paymentStatus || "—"}</td>
              <td className="px-3 py-2.5"><StatusChip raw={it.caseStatus} group={it.statusGroup} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
