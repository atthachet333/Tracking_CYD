import { useMemo } from "react";
import type { CustomerCaseItem, CustomerStatusGroup } from "@/types/customer-dashboard";
import { EmptyState, Avatar } from "@/components/ui/primitives";
import { StatusChip } from "./StatusChip";

type FocusGroup = CustomerStatusGroup | "all";

interface Props {
  cases: CustomerCaseItem[];
  filter: FocusGroup | null;
}

const COLS = ["วันที่", "รหัสเคส", "บริษัท", "ผู้รับผิดชอบ", "สถานะลูกค้า", "ติดตามล่าสุด"];

export function RecentCasesTable({ cases, filter }: Props) {
  const rows = useMemo(
    () => (filter && filter !== "all" ? cases.filter((c) => c.statusGroup === filter) : cases),
    [cases, filter],
  );

  if (rows.length === 0) return <EmptyState msg="ไม่มีเคสในเงื่อนไขนี้" icon="inbox" />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-line dark:border-slate-800">
            {COLS.map((h) => (
              <th key={h} className="px-3 py-2.5 text-left text-[11.5px] font-semibold uppercase tracking-wide text-muted">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((c, i) => (
            <tr key={`${c.sourceSheet}-${c.sourceRow}-${i}`} className="border-b border-line/60 hover:bg-surface dark:border-slate-800/60 dark:hover:bg-slate-800/40">
              <td className="whitespace-nowrap px-3 py-2.5 tnum text-[13px] text-muted">{c.date ?? "—"}</td>
              <td className="px-3 py-2.5 tnum text-[13px] font-semibold">{c.caseNo || "—"}</td>
              <td className="px-3 py-2.5 text-[13px]">{c.company || "—"}</td>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <Avatar name={c.assignee || "?"} size={26} />
                  <span className="text-[13px]">{c.assignee || "—"}</span>
                </div>
              </td>
              <td className="px-3 py-2.5"><StatusChip raw={c.customerStatus} group={c.statusGroup} /></td>
              <td className="max-w-[220px] truncate px-3 py-2.5 text-[13px] text-muted" title={c.latestFollowUp}>{c.latestFollowUp || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
