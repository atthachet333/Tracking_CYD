import { useState } from "react";
import { Users, Loader2, Wallet, ShieldCheck, Search } from "lucide-react";
import { useCustomers } from "@/hooks/useApi";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Card, PageHeader, SectionTitle, EmptyState, ErrorState, Skeleton, TagSoft } from "@/components/ui/primitives";
import { formatNumber, slaColor, cn } from "@/lib/utils";

export function CustomersPage() {
  const { data, isLoading, isError, error, refetch } = useCustomers({ pageSize: 200 });
  const [q, setQ] = useState("");
  const list = data?.data ?? [];
  const filtered = list.filter((c) => q === "" || c.name.includes(q));

  const totalValue = list.reduce((s, c) => s + c.value, 0);
  const activeCases = list.reduce((s, c) => s + c.cases, 0);
  const avgSla = list.length ? Math.round((list.reduce((s, c) => s + c.sla, 0) / list.length) * 10) / 10 : 0;

  return (
    <div>
      <PageHeader title="ลูกค้า (Customer Management)" subtitle="ข้อมูลลูกค้า เคส เอกสาร SLA และมูลค่าบริการ" />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="ลูกค้าทั้งหมด" value={list.length} icon={Users} color="blue" />
        <KpiCard label="เคสที่ดำเนินอยู่" value={activeCases} icon={Loader2} color="amber" />
        <KpiCard label="มูลค่าบริการรวม (บาท)" value={totalValue} icon={Wallet} color="green" feature />
        <KpiCard label="SLA เฉลี่ยลูกค้า" value={avgSla} suffix="%" decimals={1} icon={ShieldCheck} color="teal" />
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <SectionTitle title="รายชื่อลูกค้า" />
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาลูกค้า..." className="h-9 rounded-lg border border-line bg-white pl-9 pr-3 text-[13px] outline-none focus:border-brand-600 dark:border-slate-700 dark:bg-[#0f1728]" />
          </div>
        </div>

        {isLoading ? (
          <Skeleton className="h-64" />
        ) : isError ? (
          <ErrorState message={(error as Error)?.message ?? "โหลดลูกค้าไม่สำเร็จ"} onRetry={() => refetch()} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-line dark:border-slate-800">
                  {["ลูกค้า", "ประเภทบริการ", "ระดับ", "เคส", "เอกสาร", "งานค้าง", "SLA", "มูลค่า"].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left text-[11.5px] font-semibold uppercase tracking-wide text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8}><EmptyState msg="ไม่พบลูกค้า" icon="inbox" /></td></tr>
                ) : (
                  filtered.map((c) => (
                    <tr key={c.id} className="border-b border-line/60 hover:bg-surface dark:border-slate-800/60 dark:hover:bg-slate-800/40">
                      <td className="px-3 py-2.5">
                        <div className="text-[13px] font-semibold">{c.name}</div>
                        <div className="text-[11.5px] text-muted">{c.contact}</div>
                      </td>
                      <td className="px-3 py-2.5"><TagSoft>{c.type}</TagSoft></td>
                      <td className="px-3 py-2.5">
                        <span className={cn("rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold", c.tier === "Platinum" ? "bg-danger/10 text-danger" : c.tier === "Gold" ? "bg-warning/15 text-amber-700" : "bg-success/10 text-success")}>
                          {c.tier}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 tnum text-[13px]">{c.cases}</td>
                      <td className="px-3 py-2.5 tnum text-[13px]">{c.docs}</td>
                      <td className="px-3 py-2.5 tnum text-[13px]" style={{ color: c.pending > 2 ? "#EF4444" : undefined }}>{c.pending}</td>
                      <td className="px-3 py-2.5 tnum text-[13px] font-bold" style={{ color: slaColor(c.sla) }}>{c.sla}%</td>
                      <td className="px-3 py-2.5 tnum text-[13px]">฿{formatNumber(c.value)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
