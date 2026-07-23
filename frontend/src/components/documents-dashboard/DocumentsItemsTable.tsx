import { useMemo, useState } from "react";
import { Search, Download, ArrowUpDown } from "lucide-react";
import { useDocumentsItems } from "@/hooks/useDocumentsDashboard";
import type { DocumentTaskItem } from "@/types/documents-dashboard";
import type { CustomerStatusGroup } from "@/types/customer-dashboard";
import { Skeleton, ErrorState, EmptyState, Button, Avatar } from "@/components/ui/primitives";
import { StatusChip } from "@/components/customer-dashboard/StatusChip";
import { DocumentDetailDrawer } from "./DocumentDetailDrawer";
import { GROUP_META } from "@/components/customer-dashboard/groups";
import { downloadCsv } from "@/lib/csv";
import { cn } from "@/lib/utils";

type SortKey = "workDate" | "caseNo" | "assignee" | "company" | "paymentStatus" | "caseStatus";

const STATUS_OPTIONS: { v: CustomerStatusGroup | "all"; t: string }[] = [
  { v: "all", t: "ทุกสถานะเคส" },
  { v: "completed", t: GROUP_META.completed.label },
  { v: "in_progress", t: GROUP_META.in_progress.label },
  { v: "issues", t: GROUP_META.issues.label },
  { v: "unclassified", t: GROUP_META.unclassified.label },
];

/** 7 คอลัมน์ธุรกิจ (ชื่อไทยครบ) */
const COLUMNS: { key: SortKey; label: string; sort?: boolean; clamp?: boolean }[] = [
  { key: "workDate", label: "วันที่", sort: true },
  { key: "caseNo", label: "รหัสเคส", sort: true },
  { key: "assignee", label: "ผู้รับผิดชอบ", sort: true },
  { key: "company", label: "ชื่อบริษัท", sort: true },
  { key: "paymentStatus", label: "สถานะการชำระ", sort: true },
  { key: "caseStatus", label: "สถานะเคส", sort: true },
];

export function DocumentsItemsTable() {
  const all = useDocumentsItems({ pageSize: 2000 });
  const rowsAll = useMemo(() => all.data?.data ?? [], [all.data?.data]);

  const [search, setSearch] = useState("");
  const [assignee, setAssignee] = useState("all");
  const [company, setCompany] = useState("all");
  const [payment, setPayment] = useState("all");
  const [statusGroup, setStatusGroup] = useState<CustomerStatusGroup | "all">("all");
  const [sortBy, setSortBy] = useState<SortKey>("workDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<DocumentTaskItem | null>(null);
  const pageSize = 15;

  const assignees = useMemo(() => Array.from(new Set(rowsAll.map((r) => r.assignee).filter(Boolean))).sort(), [rowsAll]);
  const companies = useMemo(() => Array.from(new Set(rowsAll.map((r) => r.company).filter(Boolean))).sort(), [rowsAll]);
  const payments = useMemo(() => Array.from(new Set(rowsAll.map((r) => r.paymentStatus).filter(Boolean))).sort(), [rowsAll]);

  const filtered = useMemo(() => {
    let rows = rowsAll;
    if (assignee !== "all") rows = rows.filter((r) => r.assignee === assignee);
    if (company !== "all") rows = rows.filter((r) => r.company === company);
    if (payment !== "all") rows = rows.filter((r) => r.paymentStatus === payment);
    if (statusGroup !== "all") rows = rows.filter((r) => r.statusGroup === statusGroup);
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      rows = rows.filter((r) => [r.caseNo, r.company, r.assignee, r.paymentStatus, r.caseStatus, r.detail].some((v) => v.toLowerCase().includes(s)));
    }
    return [...rows].sort((a, b) => String(a[sortBy] ?? "").localeCompare(String(b[sortBy] ?? ""), "th") * (sortOrder === "desc" ? -1 : 1));
  }, [rowsAll, assignee, company, payment, statusGroup, search, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, totalPages);
  const pageRows = filtered.slice((current - 1) * pageSize, current * pageSize);
  const resetPage = () => setPage(1);

  const toggleSort = (k: SortKey) => { if (sortBy === k) setSortOrder((o) => (o === "asc" ? "desc" : "asc")); else { setSortBy(k); setSortOrder("asc"); } };

  const exportCsv = () => {
    const today = new Date().toISOString().slice(0, 10);
    downloadCsv(`งานแผนกเอกสาร_${today}`, [
      { key: "no", label: "ลำดับ" }, { key: "workDate", label: "วันที่" }, { key: "caseNo", label: "รหัสเคส" },
      { key: "assignee", label: "ผู้รับผิดชอบ" }, { key: "company", label: "ชื่อบริษัท" }, { key: "detail", label: "รายละเอียดเบื้องต้น" },
      { key: "paymentStatus", label: "สถานะการชำระ" }, { key: "caseStatus", label: "สถานะเคส" },
    ], filtered.map((r, i) => ({ ...r, no: i + 1 })));
  };

  return (
    <div>
      <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); resetPage(); }} placeholder="ค้นหา บริษัท / รหัสเคส / สถานะ..."
            className="h-9 w-56 max-w-full rounded-lg border border-line bg-white pl-9 pr-3 text-[13px] outline-none focus:border-brand-600 dark:border-slate-700 dark:bg-[#0f1728]" />
        </div>
        <select value={assignee} onChange={(e) => { setAssignee(e.target.value); resetPage(); }} className="h-9 rounded-lg border border-line bg-white px-3 text-[13px] dark:border-slate-700 dark:bg-[#0f1728]">
          <option value="all">ผู้รับผิดชอบ: ทั้งหมด</option>{assignees.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={company} onChange={(e) => { setCompany(e.target.value); resetPage(); }} className="h-9 max-w-[180px] rounded-lg border border-line bg-white px-3 text-[13px] dark:border-slate-700 dark:bg-[#0f1728]">
          <option value="all">บริษัท: ทั้งหมด</option>{companies.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={payment} onChange={(e) => { setPayment(e.target.value); resetPage(); }} className="h-9 max-w-[170px] rounded-lg border border-line bg-white px-3 text-[13px] dark:border-slate-700 dark:bg-[#0f1728]">
          <option value="all">การชำระ: ทั้งหมด</option>{payments.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={statusGroup} onChange={(e) => { setStatusGroup(e.target.value as CustomerStatusGroup | "all"); resetPage(); }} className="h-9 rounded-lg border border-line bg-white px-3 text-[13px] dark:border-slate-700 dark:bg-[#0f1728]">
          {STATUS_OPTIONS.map((o) => <option key={o.v} value={o.v}>{o.t}</option>)}
        </select>
        <div className="flex-1" />
        <span className="text-xs text-muted">{filtered.length} รายการ</span>
        <Button onClick={exportCsv} className={filtered.length === 0 ? "pointer-events-none opacity-50" : ""}><Download className="h-4 w-4" /> CSV</Button>
      </div>

      {all.isLoading ? <Skeleton className="h-80" />
        : all.isError ? <ErrorState message="โหลดงานเอกสารไม่สำเร็จ" onRetry={() => all.refetch()} />
        : filtered.length === 0 ? <EmptyState msg="ไม่พบงานเอกสารตามเงื่อนไข" icon="inbox" />
        : (
          <div className="max-h-[560px] overflow-auto rounded-xl border border-line dark:border-slate-800">
            <table className="w-full border-collapse text-[12.5px]">
              <thead className="sticky top-0 z-10 bg-surface dark:bg-[#0f1728]">
                <tr className="border-b border-line dark:border-slate-800">
                  <th className="px-2.5 py-2.5 text-left font-semibold text-muted">#</th>
                  {COLUMNS.map((c) => (
                    <th key={c.key} className="whitespace-nowrap px-2.5 py-2.5 text-left font-semibold text-muted">
                      {c.sort ? <button onClick={() => toggleSort(c.key)} className="inline-flex items-center gap-1 hover:text-ink dark:hover:text-slate-200">{c.label} <ArrowUpDown className={cn("h-3 w-3", sortBy === c.key ? "text-brand-600" : "opacity-40")} /></button> : c.label}
                    </th>
                  ))}
                  <th className="whitespace-nowrap px-2.5 py-2.5 text-left font-semibold text-muted">รายละเอียดเบื้องต้น</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r, i) => (
                  <tr key={`${r.sourceRow}-${i}`} className="border-b border-line/60 hover:bg-surface dark:border-slate-800/60 dark:hover:bg-slate-800/40">
                    <td className="px-2.5 py-2 tnum text-muted">{(current - 1) * pageSize + i + 1}</td>
                    <td className="whitespace-nowrap px-2.5 py-2 tnum text-muted">{r.workDate ?? "—"}</td>
                    <td className="px-2.5 py-2 tnum font-semibold">{r.caseNo || "—"}</td>
                    <td className="px-2.5 py-2"><div className="flex items-center gap-1.5"><Avatar name={r.assignee || "?"} size={22} /><span>{r.assignee || "—"}</span></div></td>
                    <td className="px-2.5 py-2">
                      <button onClick={() => setDetail(r)} className="max-w-[220px] truncate text-left font-semibold text-brand-600 hover:underline" title={r.company}>{r.company || "—"}</button>
                    </td>
                    <td className="max-w-[160px] truncate px-2.5 py-2" title={r.paymentStatus}>{r.paymentStatus || "—"}</td>
                    <td className="px-2.5 py-2"><StatusChip raw={r.caseStatus} group={r.statusGroup} /></td>
                    <td className="px-2.5 py-2">
                      <button onClick={() => setDetail(r)} className="line-clamp-2 max-w-[320px] text-left text-muted hover:text-ink dark:hover:text-slate-200" title={r.detail}>{r.detail || "—"}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      {filtered.length > pageSize && (
        <div className="mt-3.5 flex items-center justify-end gap-1">
          <button disabled={current === 1} onClick={() => setPage(current - 1)} className="h-8 rounded-lg border border-line px-3 text-sm disabled:opacity-40 dark:border-slate-700">‹</button>
          <span className="px-2 text-sm text-muted">{current} / {totalPages}</span>
          <button disabled={current === totalPages} onClick={() => setPage(current + 1)} className="h-8 rounded-lg border border-line px-3 text-sm disabled:opacity-40 dark:border-slate-700">›</button>
        </div>
      )}

      <DocumentDetailDrawer item={detail} open={detail !== null} onClose={() => setDetail(null)} />
    </div>
  );
}
