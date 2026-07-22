import { useEffect, useState } from "react";
import { Search, AlertTriangle } from "lucide-react";
import { useCustomerProblemCases } from "@/hooks/useCustomerDashboard";
import { Skeleton, ErrorState, EmptyState, Avatar } from "@/components/ui/primitives";
import { StatusChip } from "./StatusChip";

/** เคสที่ต้องติดตามเร่งด่วน (กลุ่ม issues) — search + pagination จาก backend */
export function ProblemCasesPanel() {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // debounce ค่าค้นหา 300ms
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(search), 300);
    return () => window.clearTimeout(t);
  }, [search]);

  const onSearch = (v: string) => {
    setSearch(v);
    setPage(1);
  };

  const q = useCustomerProblemCases({ page, pageSize, search: debounced || undefined });
  const rows = q.data?.data ?? [];
  const pg = q.data?.pagination;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="ค้นหา บริษัท / รหัสเคส / สถานะ..."
            className="h-9 w-64 max-w-full rounded-lg border border-line bg-white pl-9 pr-3 text-[13px] outline-none focus:border-brand-600 dark:border-slate-700 dark:bg-[#0f1728]"
          />
        </div>
        <div className="flex-1" />
        {pg && <span className="text-xs text-muted">{pg.total} รายการ</span>}
      </div>

      {q.isLoading ? (
        <Skeleton className="h-56" />
      ) : q.isError ? (
        <ErrorState message="โหลดเคสที่มีปัญหาไม่สำเร็จ" onRetry={() => q.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState msg={debounced ? "ไม่พบเคสตามคำค้น" : "ไม่มีเคสที่มีปัญหา 🎉"} icon="inbox" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-line dark:border-slate-800">
                {["วันที่", "รหัสเคส", "บริษัท", "ผู้รับผิดชอบ", "สถานะ"].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-[11.5px] font-semibold uppercase tracking-wide text-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((c, i) => (
                <tr key={`${c.sourceSheet}-${c.sourceRow}-${i}`} className="border-b border-line/60 hover:bg-danger/5 dark:border-slate-800/60">
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pg && pg.totalPages > 1 && (
        <div className="mt-3.5 flex items-center justify-end gap-1">
          <button disabled={pg.page === 1} onClick={() => setPage((p) => p - 1)} className="h-8 rounded-lg border border-line px-3 text-sm disabled:opacity-40 dark:border-slate-700">‹</button>
          <span className="px-2 text-sm text-muted">{pg.page} / {pg.totalPages}</span>
          <button disabled={pg.page >= pg.totalPages} onClick={() => setPage((p) => p + 1)} className="h-8 rounded-lg border border-line px-3 text-sm disabled:opacity-40 dark:border-slate-700">›</button>
        </div>
      )}

      {!q.isLoading && !q.isError && rows.length > 0 && (
        <div className="mt-3 flex items-center gap-1.5 text-[11.5px] text-muted">
          <AlertTriangle className="h-3.5 w-3.5 text-danger" /> เคสกลุ่มนี้ควรได้รับการติดตามก่อน
        </div>
      )}
    </div>
  );
}
