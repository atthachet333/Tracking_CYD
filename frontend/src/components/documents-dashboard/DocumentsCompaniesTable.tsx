import type { DocumentsCompanyStat } from "@/types/documents-dashboard";
import { EmptyState, TagSoft } from "@/components/ui/primitives";

export function DocumentsCompaniesTable({ data, showPayment = false }: { data: DocumentsCompanyStat[]; showPayment?: boolean }) {
  if (!data.length) return <EmptyState msg="ยังไม่มีข้อมูลบริษัท" icon="inbox" />;
  const cols = ["ชื่อบริษัท", "จำนวนงาน", "ผู้รับผิดชอบ", ...(showPayment ? ["สถานะการชำระล่าสุด"] : []), "สถานะล่าสุด", "รายละเอียดล่าสุด", "วันที่ล่าสุด"];
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-line dark:border-slate-800">
            {cols.map((h) => <th key={h} className="whitespace-nowrap px-3 py-2.5 text-left text-[11.5px] font-semibold uppercase tracking-wide text-muted">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map((c) => (
            <tr key={c.company} className="border-b border-line/60 hover:bg-surface dark:border-slate-800/60 dark:hover:bg-slate-800/40">
              <td className="px-3 py-2.5 font-semibold">{c.company}</td>
              <td className="px-3 py-2.5 tnum">{c.total}</td>
              <td className="px-3 py-2.5">
                <div className="flex flex-wrap gap-1">{c.assignees.map((a) => <TagSoft key={a}>{a}</TagSoft>)}</div>
              </td>
              {showPayment && <td className="max-w-[160px] truncate px-3 py-2.5" title={c.latestPayment}>{c.latestPayment || "—"}</td>}
              <td className="px-3 py-2.5">{c.latestStatus || "—"}</td>
              <td className="max-w-[280px] truncate px-3 py-2.5 text-muted" title={c.latestDetail}>{c.latestDetail || "—"}</td>
              <td className="whitespace-nowrap px-3 py-2.5 tnum text-muted">{c.latestDate ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
