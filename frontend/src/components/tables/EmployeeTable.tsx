import { useMemo, useState } from "react";
import { Search, Eye, ArrowUpDown, Download } from "lucide-react";
import type { Employee } from "@/types";
import { slaColor, cn } from "@/lib/utils";
import { LoadChip, TagSoft, EmptyState, Avatar } from "@/components/ui/primitives";
import { Sparkline } from "@/components/charts/Charts";

type SortKey = "sla" | "active" | "done" | "load";
const loadOrder: Record<string, number> = { high: 3, mid: 2, low: 1 };

export function EmployeeTable({ employees, pageSize = 6, onView }: { employees: Employee[]; pageSize?: number; onView: (e: Employee) => void }) {
  const [q, setQ] = useState("");
  const [load, setLoad] = useState("all");
  const [sort, setSort] = useState<SortKey>("sla");
  const [dir, setDir] = useState<-1 | 1>(-1);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let rows = employees.filter(
      (e) =>
        (q === "" || e.name.includes(q) || e.role.toLowerCase().includes(q.toLowerCase())) &&
        (load === "all" || e.load === load),
    );
    rows = [...rows].sort((a, b) => {
      const av = sort === "load" ? loadOrder[a.load] : a[sort];
      const bv = sort === "load" ? loadOrder[b.load] : b[sort];
      return (av - bv) * dir;
    });
    return rows;
  }, [employees, q, load, sort, dir]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * pageSize, current * pageSize);

  const toggleSort = (k: SortKey) => {
    if (sort === k) setDir((d) => (d === 1 ? -1 : 1));
    else {
      setSort(k);
      setDir(-1);
    }
  };

  const Th = ({ label, k }: { label: string; k: SortKey }) => (
    <th onClick={() => toggleSort(k)} className="cursor-pointer select-none px-3 py-2.5 text-left text-[11.5px] font-semibold uppercase tracking-wide text-muted">
      <span className="inline-flex items-center gap-1">
        {label} <ArrowUpDown className="h-3 w-3 opacity-50" />
      </span>
    </th>
  );

  return (
    <div>
      <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="ค้นหาพนักงาน..."
            className="h-9 rounded-lg border border-line bg-white pl-9 pr-3 text-[13px] outline-none focus:border-brand-600 dark:border-slate-700 dark:bg-[#0f1728]"
          />
        </div>
        <select
          value={load}
          onChange={(e) => {
            setLoad(e.target.value);
            setPage(1);
          }}
          className="h-9 rounded-lg border border-line bg-white px-3 text-[13px] outline-none dark:border-slate-700 dark:bg-[#0f1728]"
        >
          <option value="all">ภาระงาน: ทั้งหมด</option>
          <option value="high">สูง</option>
          <option value="mid">ปานกลาง</option>
          <option value="low">ต่ำ</option>
        </select>
        <div className="flex-1" />
        <button className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-[13px] font-semibold hover:bg-surface dark:border-slate-700 dark:hover:bg-slate-800">
          <Download className="h-4 w-4" /> CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-line dark:border-slate-800">
              <th className="px-3 py-2.5 text-left text-[11.5px] font-semibold uppercase tracking-wide text-muted">พนักงาน</th>
              <th className="hidden px-3 py-2.5 text-left text-[11.5px] font-semibold uppercase tracking-wide text-muted md:table-cell">แผนก</th>
              <Th label="ภาระงาน" k="load" />
              <Th label="กำลังทำ" k="active" />
              <Th label="เสร็จแล้ว" k="done" />
              <Th label="SLA" k="sla" />
              <th className="hidden px-3 py-2.5 text-left text-[11.5px] font-semibold uppercase tracking-wide text-muted md:table-cell">Trend</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <EmptyState msg="ไม่พบพนักงาน" hint="ลองปรับเงื่อนไขการค้นหา" icon="inbox" />
                </td>
              </tr>
            ) : (
              rows.map((e) => (
                <tr key={e.id} className="border-b border-line/60 transition hover:bg-surface dark:border-slate-800/60 dark:hover:bg-slate-800/40">
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={e.name} img={e.img} size={32} />
                      <div>
                        <div className="flex items-center gap-1.5 text-[13px] font-semibold">
                          {e.name}
                          <span className={cn("h-2 w-2 rounded-full", e.online ? "bg-success" : "bg-slate-300")} />
                        </div>
                        <div className="text-[11.5px] text-muted">{e.role}</div>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-3 py-2.5 md:table-cell">
                    <TagSoft>{e.dept}</TagSoft>
                  </td>
                  <td className="px-3 py-2.5">
                    <LoadChip level={e.load} />
                  </td>
                  <td className="px-3 py-2.5 tnum text-[13px]">{e.active}</td>
                  <td className="px-3 py-2.5 tnum text-[13px]">{e.done}</td>
                  <td className="px-3 py-2.5">
                    <span className="tnum text-[13px] font-bold" style={{ color: slaColor(e.sla) }}>
                      {e.sla}%
                    </span>
                  </td>
                  <td className="hidden px-3 py-2.5 md:table-cell">
                    <Sparkline data={e.trend} color={slaColor(e.sla)} />
                  </td>
                  <td className="px-3 py-2.5">
                    <button onClick={() => onView(e)} title="ดูรายละเอียด" className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-brand-600/10 hover:text-brand-600">
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-muted">
            แสดง {(current - 1) * pageSize + 1}–{Math.min(current * pageSize, filtered.length)} จาก {filtered.length} รายการ
          </span>
          <div className="flex items-center gap-1">
            <PageBtn disabled={current === 1} onClick={() => setPage(current - 1)}>
              ‹
            </PageBtn>
            {Array.from({ length: pages }, (_, i) => i + 1).slice(0, 5).map((p) => (
              <PageBtn key={p} active={p === current} onClick={() => setPage(p)}>
                {p}
              </PageBtn>
            ))}
            <PageBtn disabled={current === pages} onClick={() => setPage(current + 1)}>
              ›
            </PageBtn>
          </div>
        </div>
      )}
    </div>
  );
}

function PageBtn({ children, active, disabled, onClick }: { children: React.ReactNode; active?: boolean; disabled?: boolean; onClick?: () => void }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "grid h-8 min-w-8 place-items-center rounded-lg border px-2 font-num text-[13px] font-semibold transition",
        active ? "border-brand-600 bg-brand-600 text-white" : "border-line text-muted hover:bg-surface dark:border-slate-700 dark:hover:bg-slate-800",
        disabled && "opacity-40",
      )}
    >
      {children}
    </button>
  );
}
