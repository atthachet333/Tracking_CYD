import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Download, ArrowUpDown, ExternalLink } from "lucide-react";
import { useUnifiedTasks } from "@/hooks/useUnifiedTasks";
import type { UnifiedTask, TaskDepartment } from "@/types/documents-dashboard";
import type { CustomerStatusGroup } from "@/types/customer-dashboard";
import { Skeleton, ErrorState, EmptyState, Button, Avatar } from "@/components/ui/primitives";
import { StatusChip } from "@/components/customer-dashboard/StatusChip";
import { Drawer } from "@/components/ui/Drawer";
import { GROUP_META } from "@/components/customer-dashboard/groups";
import { downloadCsv } from "@/lib/csv";
import { cn } from "@/lib/utils";

type DeptFilter = TaskDepartment | "all";
type SortKey = "workDate" | "caseNo" | "companyName" | "assignee" | "actualStatus" | "department";

const DEPT_META: Record<TaskDepartment, { label: string; chip: string }> = {
  admin: { label: "Admin", chip: "bg-brand-600/10 text-brand-600" },
  documents: { label: "เอกสาร", chip: "bg-teal/10 text-teal" },
};

const STATUS_OPTIONS: { v: CustomerStatusGroup | "all"; t: string }[] = [
  { v: "all", t: "ทุกสถานะ" },
  { v: "completed", t: GROUP_META.completed.label },
  { v: "in_progress", t: GROUP_META.in_progress.label },
  { v: "issues", t: GROUP_META.issues.label },
  { v: "unclassified", t: GROUP_META.unclassified.label },
];

const COLUMNS: { key: keyof UnifiedTask; label: string; sort?: SortKey }[] = [
  { key: "workDate", label: "วันที่", sort: "workDate" },
  { key: "caseNo", label: "รหัสเคส", sort: "caseNo" },
  { key: "companyName", label: "ชื่อบริษัท", sort: "companyName" },
  { key: "assignee", label: "ผู้รับผิดชอบ", sort: "assignee" },
  { key: "detail", label: "รายละเอียด" },
  { key: "latestFollowUp", label: "ขั้นตอนล่าสุด" },
  { key: "actualStatus", label: "สถานะจริง", sort: "actualStatus" },
];

export function UnifiedTasksTable() {
  const [params, setParams] = useSearchParams();
  const all = useUnifiedTasks({ pageSize: 1000 });
  const rowsAll = useMemo(() => all.data?.data ?? [], [all.data?.data]);

  const dept = (params.get("department") as DeptFilter) ?? "all";
  const statusGroup = (params.get("statusGroup") as CustomerStatusGroup | null) ?? null;
  const assigneeParam = params.get("assignee") ?? "all";

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("workDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<UnifiedTask | null>(null);
  const pageSize = 15;

  useEffect(() => setPage(1), [dept, statusGroup, assigneeParam, search]);

  const setParam = (key: string, val: string | null) => {
    const next = new URLSearchParams(params);
    if (!val || val === "all") next.delete(key);
    else next.set(key, val);
    setParams(next, { replace: true });
  };

  const assignees = useMemo(() => Array.from(new Set(rowsAll.map((r) => r.assignee).filter(Boolean))).sort(), [rowsAll]);

  const filtered = useMemo(() => {
    let rows = rowsAll;
    if (dept !== "all") rows = rows.filter((r) => r.department === dept);
    if (statusGroup) rows = rows.filter((r) => r.statusGroup === statusGroup);
    if (assigneeParam !== "all") rows = rows.filter((r) => r.assignee === assigneeParam);
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      rows = rows.filter((r) => [r.caseNo, r.companyName, r.assignee, r.actualStatus, r.detail].some((v) => v.toLowerCase().includes(s)));
    }
    return [...rows].sort((a, b) => String(a[sortBy] ?? "").localeCompare(String(b[sortBy] ?? ""), "th") * (sortOrder === "desc" ? -1 : 1));
  }, [rowsAll, dept, statusGroup, assigneeParam, search, sortBy, sortOrder]);

  const counts = useMemo(() => ({
    all: rowsAll.length,
    admin: rowsAll.filter((r) => r.department === "admin").length,
    documents: rowsAll.filter((r) => r.department === "documents").length,
  }), [rowsAll]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, totalPages);
  const pageRows = filtered.slice((current - 1) * pageSize, current * pageSize);

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else { setSortBy(key); setSortOrder("asc"); }
  };

  const exportCsv = () => downloadCsv("tasks-unified", [
    { key: "no", label: "ลำดับ" }, { key: "department", label: "แผนก" }, { key: "workDate", label: "วันที่" },
    { key: "caseNo", label: "รหัสเคส" }, { key: "companyName", label: "ชื่อบริษัท" }, { key: "assignee", label: "ผู้รับผิดชอบ" },
    { key: "detail", label: "รายละเอียด" }, { key: "actualStatus", label: "สถานะจริง" }, { key: "statusGroup", label: "กลุ่มสถานะ" },
    { key: "sourceSheet", label: "source_sheet" }, { key: "sourceRow", label: "source_row" },
  ], filtered.map((r, i) => ({ ...r, no: i + 1 })));

  return (
    <div>
      {/* Department segmented control */}
      <div className="mb-3 inline-flex rounded-xl border border-line p-1 dark:border-slate-700">
        {([["all", `ทั้งหมด (${counts.all})`], ["admin", `Admin (${counts.admin})`], ["documents", `เอกสาร (${counts.documents})`]] as const).map(([v, label]) => (
          <button key={v} onClick={() => setParam("department", v)}
            className={cn("rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition", dept === v ? "bg-brand-600 text-white" : "text-muted hover:bg-surface dark:hover:bg-slate-800")}>
            {label}
          </button>
        ))}
      </div>

      <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหา บริษัท / รหัสเคส / สถานะ..."
            className="h-9 w-60 max-w-full rounded-lg border border-line bg-white pl-9 pr-3 text-[13px] outline-none focus:border-brand-600 dark:border-slate-700 dark:bg-[#0f1728]" />
        </div>
        <select value={statusGroup ?? "all"} onChange={(e) => setParam("statusGroup", e.target.value)}
          className="h-9 rounded-lg border border-line bg-white px-3 text-[13px] dark:border-slate-700 dark:bg-[#0f1728]">
          {STATUS_OPTIONS.map((o) => <option key={o.v} value={o.v}>สถานะ: {o.t}</option>)}
        </select>
        <select value={assigneeParam} onChange={(e) => setParam("assignee", e.target.value)}
          className="h-9 rounded-lg border border-line bg-white px-3 text-[13px] dark:border-slate-700 dark:bg-[#0f1728]">
          <option value="all">ผู้รับผิดชอบ: ทั้งหมด</option>
          {assignees.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <div className="flex-1" />
        <span className="text-xs text-muted">{filtered.length} รายการ</span>
        <Button onClick={exportCsv} className={filtered.length === 0 ? "pointer-events-none opacity-50" : ""}><Download className="h-4 w-4" /> CSV</Button>
      </div>

      {all.isLoading ? <Skeleton className="h-80" />
        : all.isError ? <ErrorState message="โหลดงานทั้งหมดไม่สำเร็จ" onRetry={() => all.refetch()} />
        : filtered.length === 0 ? <EmptyState msg="ไม่พบงานตามเงื่อนไข" icon="inbox" />
        : (
          <div className="max-h-[560px] overflow-auto rounded-xl border border-line dark:border-slate-800">
            <table className="w-full border-collapse text-[12.5px]">
              <thead className="sticky top-0 z-10 bg-surface dark:bg-[#0f1728]">
                <tr className="border-b border-line dark:border-slate-800">
                  <th className="px-2.5 py-2.5 text-left font-semibold text-muted">#</th>
                  <th className="px-2.5 py-2.5 text-left font-semibold text-muted">
                    <button onClick={() => toggleSort("department")} className="inline-flex items-center gap-1 hover:text-ink dark:hover:text-slate-200">แผนก <ArrowUpDown className={cn("h-3 w-3", sortBy === "department" ? "text-brand-600" : "opacity-40")} /></button>
                  </th>
                  {COLUMNS.map((c) => (
                    <th key={String(c.key)} className="whitespace-nowrap px-2.5 py-2.5 text-left font-semibold text-muted">
                      {c.sort ? <button onClick={() => toggleSort(c.sort!)} className="inline-flex items-center gap-1 hover:text-ink dark:hover:text-slate-200">{c.label} <ArrowUpDown className={cn("h-3 w-3", sortBy === c.sort ? "text-brand-600" : "opacity-40")} /></button> : c.label}
                    </th>
                  ))}
                  <th className="px-2.5 py-2.5 text-left font-semibold text-muted">ลิงก์</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r, i) => (
                  <tr key={r.id} className="border-b border-line/60 hover:bg-surface dark:border-slate-800/60 dark:hover:bg-slate-800/40">
                    <td className="px-2.5 py-2 tnum text-muted">{(current - 1) * pageSize + i + 1}</td>
                    <td className="px-2.5 py-2"><span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", DEPT_META[r.department].chip)}>{DEPT_META[r.department].label}</span></td>
                    <td className="px-2.5 py-2 tnum text-muted">{r.workDate ?? "—"}</td>
                    <td className="px-2.5 py-2 tnum font-semibold">{r.caseNo || "—"}</td>
                    <td className="px-2.5 py-2">
                      <button onClick={() => setDetail(r)} className="max-w-[220px] truncate text-left font-semibold text-brand-600 hover:underline" title={r.companyName}>{r.companyName || "—"}</button>
                    </td>
                    <td className="px-2.5 py-2"><div className="flex items-center gap-1.5"><Avatar name={r.assignee || "?"} size={22} /><span>{r.assignee || "—"}</span></div></td>
                    <td className="max-w-[240px] truncate px-2.5 py-2 text-muted" title={r.detail}>{r.detail || "—"}</td>
                    <td className="max-w-[180px] truncate px-2.5 py-2 text-muted" title={r.latestFollowUp}>{r.latestFollowUp || "—"}</td>
                    <td className="px-2.5 py-2"><StatusChip raw={r.actualStatus} group={r.statusGroup} /></td>
                    <td className="px-2.5 py-2">
                      {r.links.length > 0 ? <a href={r.links[0]} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand-600 hover:underline">เปิด <ExternalLink className="h-3 w-3" /></a> : <span className="text-slate-400">—</span>}
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

      <Drawer open={detail !== null} onClose={() => setDetail(null)} title={detail?.companyName || "รายละเอียดงาน"}>
        {detail && (
          <div className="space-y-2 text-[13.5px]">
            {([["แผนก", DEPT_META[detail.department].label], ["วันที่", detail.workDate ?? "—"], ["รหัสเคส", detail.caseNo || "—"],
               ["ผู้รับผิดชอบ", detail.assignee || "—"], ["สถานะจริง", detail.actualStatus || "—"], ["ขั้นตอนล่าสุด", detail.latestFollowUp || "—"],
               ["รายละเอียด", detail.detail || "—"], ["source", `${detail.sourceSheet} · row ${detail.sourceRow}`]] as const).map(([k, v]) => (
              <div key={k} className="border-b border-line/60 py-2 dark:border-slate-800/60">
                <div className="text-[11.5px] font-semibold uppercase tracking-wide text-muted">{k}</div>
                <div className="mt-0.5 whitespace-pre-wrap">{v}</div>
              </div>
            ))}
            {detail.links.length > 0 && (
              <div className="pt-2">
                {detail.links.map((l) => <a key={l} href={l} target="_blank" rel="noopener noreferrer" className="mr-2 inline-flex items-center gap-1 text-brand-600 hover:underline">เปิดลิงก์ <ExternalLink className="h-3.5 w-3.5" /></a>)}
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
