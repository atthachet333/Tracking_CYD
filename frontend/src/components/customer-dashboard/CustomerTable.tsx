import { useMemo, useState } from "react";
import { Search, Download, ArrowUpDown, ExternalLink } from "lucide-react";
import type { CustomerCaseItem, CustomerStatusGroup } from "@/types/customer-dashboard";
import { useCustomersList } from "@/hooks/useCustomerDashboard";
import { Skeleton, ErrorState, EmptyState, Button } from "@/components/ui/primitives";
import { StatusChip } from "./StatusChip";
import { CompanyDetailDrawer } from "./CompanyDetailDrawer";
import { GROUP_META } from "./groups";
import { downloadCsv } from "@/lib/csv";
import { cn } from "@/lib/utils";

type FocusGroup = CustomerStatusGroup | "all";
type SortKey = "date" | "caseNo" | "company" | "assignee" | "customerStatus";

interface Props {
  statusGroup: FocusGroup | null;
  onStatusGroupChange: (g: FocusGroup | null) => void;
}

const COLUMNS: { key: keyof CustomerCaseItem; label: string; sort?: SortKey; link?: boolean; wide?: boolean }[] = [
  { key: "date", label: "วันที่", sort: "date" },
  { key: "caseNo", label: "รหัสเคส", sort: "caseNo" },
  { key: "company", label: "ชื่อบริษัท", sort: "company", wide: true },
  { key: "initialDetail", label: "รายละเอียดเบื้องต้น", wide: true },
  { key: "quotation", label: "ทำใบเสนอราคา" },
  { key: "quotationLink", label: "ลิงก์ใบเสนอราคา", link: true },
  { key: "followUp1", label: "ติดตาม 1", wide: true },
  { key: "followUp2", label: "ติดตาม 2", wide: true },
  { key: "followUp3", label: "ติดตาม 3", wide: true },
  { key: "customerStatus", label: "สถานะลูกค้า", sort: "customerStatus" },
  { key: "deposit", label: "มัดจำ" },
  { key: "contractDraft", label: "ร่างสัญญา" },
  { key: "contractLink", label: "ลิงก์สัญญา", link: true },
  { key: "assignee", label: "ผู้รับผิดชอบ", sort: "assignee" },
  { key: "sourceSheet", label: "source_sheet" },
  { key: "sourceRow", label: "source_row" },
];

const CSV_COLUMNS = [{ key: "no", label: "ลำดับ" }, ...COLUMNS.map((c) => ({ key: c.key as string, label: c.label }))];
const STATUS_OPTIONS: { v: FocusGroup; t: string }[] = [
  { v: "all", t: "ทุกสถานะ" },
  { v: "completed", t: GROUP_META.completed.label },
  { v: "in_progress", t: GROUP_META.in_progress.label },
  { v: "issues", t: GROUP_META.issues.label },
  { v: "unclassified", t: GROUP_META.unclassified.label },
];

function isUrl(v: string): boolean {
  return /^https?:\/\//i.test(v.trim());
}

export function CustomerTable({ statusGroup, onStatusGroupChange }: Props) {
  // ดึงทั้งหมดครั้งเดียว (dataset เล็ก) แล้ว filter/sort/paginate ฝั่ง client เพื่อความลื่นไหล
  const all = useCustomersList({ pageSize: 500 });
  const rowsAll = useMemo(() => all.data?.data ?? [], [all.data?.data]);

  const [search, setSearch] = useState("");
  const [assignee, setAssignee] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<CustomerCaseItem | null>(null);
  const pageSize = 15;

  const assignees = useMemo(
    () => Array.from(new Set(rowsAll.map((r) => r.assignee).filter(Boolean))).sort(),
    [rowsAll],
  );

  const group = statusGroup ?? "all";

  const filtered = useMemo(() => {
    let rows = rowsAll;
    if (group !== "all") rows = rows.filter((r) => r.statusGroup === group);
    if (assignee !== "all") rows = rows.filter((r) => r.assignee === assignee);
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      rows = rows.filter((r) =>
        [r.caseNo, r.company, r.assignee, r.customerStatus, r.initialDetail, r.latestFollowUp].some((v) =>
          v.toLowerCase().includes(s),
        ),
      );
    }
    return [...rows].sort((a, b) => {
      const dir = sortOrder === "desc" ? -1 : 1;
      return String(a[sortBy] ?? "").localeCompare(String(b[sortBy] ?? ""), "th") * dir;
    });
  }, [rowsAll, group, assignee, search, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, totalPages);
  const pageRows = filtered.slice((current - 1) * pageSize, current * pageSize);

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else { setSortBy(key); setSortOrder("asc"); }
    setPage(1);
  };

  const exportCsv = () => {
    const rows = filtered.map((r, i) => ({ no: i + 1, ...r }));
    downloadCsv("customers", CSV_COLUMNS, rows);
  };

  return (
    <div>
      <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="ค้นหา บริษัท / รหัสเคส / สถานะ..."
            className="h-9 w-60 max-w-full rounded-lg border border-line bg-white pl-9 pr-3 text-[13px] outline-none focus:border-brand-600 dark:border-slate-700 dark:bg-[#0f1728]"
          />
        </div>
        <select
          value={group}
          onChange={(e) => { onStatusGroupChange(e.target.value === "all" ? null : (e.target.value as FocusGroup)); setPage(1); }}
          className="h-9 rounded-lg border border-line bg-white px-3 text-[13px] dark:border-slate-700 dark:bg-[#0f1728]"
        >
          {STATUS_OPTIONS.map((o) => <option key={o.v} value={o.v}>สถานะ: {o.t}</option>)}
        </select>
        <select
          value={assignee}
          onChange={(e) => { setAssignee(e.target.value); setPage(1); }}
          className="h-9 rounded-lg border border-line bg-white px-3 text-[13px] dark:border-slate-700 dark:bg-[#0f1728]"
        >
          <option value="all">ผู้รับผิดชอบ: ทั้งหมด</option>
          {assignees.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <div className="flex-1" />
        <span className="text-xs text-muted">{filtered.length} รายการ</span>
        <Button onClick={exportCsv} className={filtered.length === 0 ? "pointer-events-none opacity-50" : ""}>
          <Download className="h-4 w-4" /> CSV
        </Button>
      </div>

      {all.isLoading ? (
        <Skeleton className="h-80" />
      ) : all.isError ? (
        <ErrorState message="โหลดรายชื่อลูกค้าไม่สำเร็จ" onRetry={() => all.refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState msg="ไม่พบลูกค้าตามเงื่อนไข" icon="inbox" />
      ) : (
        <div className="max-h-[560px] overflow-auto rounded-xl border border-line dark:border-slate-800">
          <table className="w-full border-collapse text-[12.5px]">
            <thead className="sticky top-0 z-10 bg-surface dark:bg-[#0f1728]">
              <tr className="border-b border-line dark:border-slate-800">
                <th className="whitespace-nowrap px-2.5 py-2.5 text-left font-semibold text-muted">#</th>
                {COLUMNS.map((c) => (
                  <th key={String(c.key)} className="whitespace-nowrap px-2.5 py-2.5 text-left font-semibold text-muted">
                    {c.sort ? (
                      <button onClick={() => toggleSort(c.sort!)} className="inline-flex items-center gap-1 hover:text-ink dark:hover:text-slate-200">
                        {c.label} <ArrowUpDown className={cn("h-3 w-3", sortBy === c.sort ? "text-brand-600" : "opacity-40")} />
                      </button>
                    ) : c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r, i) => (
                <tr key={`${r.sourceSheet}-${r.sourceRow}-${i}`} className="border-b border-line/60 hover:bg-surface dark:border-slate-800/60 dark:hover:bg-slate-800/40">
                  <td className="px-2.5 py-2 tnum text-muted">{(current - 1) * pageSize + i + 1}</td>
                  {COLUMNS.map((c) => {
                    const val = String(r[c.key] ?? "");
                    if (c.key === "company") {
                      return (
                        <td key={String(c.key)} className="px-2.5 py-2">
                          <button onClick={() => setDetail(r)} className="max-w-[240px] truncate text-left font-semibold text-brand-600 hover:underline" title={val}>
                            {val || "—"}
                          </button>
                        </td>
                      );
                    }
                    if (c.key === "customerStatus") {
                      return <td key={String(c.key)} className="px-2.5 py-2"><StatusChip raw={r.customerStatus} group={r.statusGroup} /></td>;
                    }
                    if (c.link && isUrl(val)) {
                      return (
                        <td key={String(c.key)} className="px-2.5 py-2">
                          <a href={val} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand-600 hover:underline">
                            เปิด <ExternalLink className="h-3 w-3" />
                          </a>
                        </td>
                      );
                    }
                    return (
                      <td key={String(c.key)} className={cn("px-2.5 py-2", c.wide ? "max-w-[220px] truncate" : "whitespace-nowrap")} title={c.wide ? val : undefined}>
                        {val || "—"}
                      </td>
                    );
                  })}
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

      <CompanyDetailDrawer item={detail} open={detail !== null} onClose={() => setDetail(null)} />
    </div>
  );
}
