import { useState } from "react";
import { ExternalLink } from "lucide-react";
import type { CustomerCaseItem } from "@/types/customer-dashboard";
import { EmptyState } from "@/components/ui/primitives";
import { StatusChip } from "./StatusChip";
import { CompanyDetailDrawer } from "./CompanyDetailDrawer";

export type MiniColumn = { key: keyof CustomerCaseItem; label: string; kind?: "company" | "status" | "link" | "text" };

function isUrl(v: string): boolean {
  return /^https?:\/\//i.test(v.trim());
}

/** ตารางย่อ reusable (in-progress / completed) + คลิกบริษัทเปิด Detail Drawer */
export function CasesMiniTable({
  cases, columns, emptyMsg = "ไม่มีรายการ", limit,
}: {
  cases: CustomerCaseItem[]; columns: MiniColumn[]; emptyMsg?: string; limit?: number;
}) {
  const [detail, setDetail] = useState<CustomerCaseItem | null>(null);
  const rows = limit ? cases.slice(0, limit) : cases;

  if (rows.length === 0) return <EmptyState msg={emptyMsg} icon="inbox" />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12.5px]">
        <thead>
          <tr className="border-b border-line dark:border-slate-800">
            {columns.map((c) => (
              <th key={String(c.key)} className="whitespace-nowrap px-2.5 py-2 text-left font-semibold uppercase tracking-wide text-muted">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.sourceSheet}-${r.sourceRow}-${i}`} className="border-b border-line/60 hover:bg-surface dark:border-slate-800/60 dark:hover:bg-slate-800/40">
              {columns.map((c) => {
                const val = String(r[c.key] ?? "");
                if (c.kind === "company") {
                  return (
                    <td key={String(c.key)} className="px-2.5 py-2">
                      <button onClick={() => setDetail(r)} className="max-w-[220px] truncate text-left font-semibold text-brand-600 hover:underline" title={val}>{val || "—"}</button>
                    </td>
                  );
                }
                if (c.kind === "status") return <td key={String(c.key)} className="px-2.5 py-2"><StatusChip raw={r.customerStatus} group={r.statusGroup} /></td>;
                if (c.kind === "link") {
                  return (
                    <td key={String(c.key)} className="px-2.5 py-2">
                      {isUrl(val) ? (
                        <a href={val} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand-600 hover:underline">เปิด <ExternalLink className="h-3 w-3" /></a>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                  );
                }
                return <td key={String(c.key)} className="max-w-[220px] truncate px-2.5 py-2" title={val}>{val || "—"}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <CompanyDetailDrawer item={detail} open={detail !== null} onClose={() => setDetail(null)} />
    </div>
  );
}
