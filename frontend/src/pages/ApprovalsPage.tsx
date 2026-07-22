import { useState } from "react";
import { Clock, FileSignature, RotateCcw, CheckCircle2, Check, X, Eye } from "lucide-react";
import { useApprovals } from "@/hooks/useApi";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Card, PageHeader, SectionTitle, EmptyState, ErrorState, Skeleton, StatusBadge, TagSoft, Button } from "@/components/ui/primitives";
import { Drawer } from "@/components/ui/Drawer";
import { avatarUrl } from "@/lib/utils";
import { useUiStore } from "@/stores/uiStore";
import type { DocumentItem } from "@/types";

export function ApprovalsPage() {
  const { data, isLoading, isError, error, refetch } = useApprovals();
  const pushToast = useUiStore((s) => s.pushToast);
  const [selected, setSelected] = useState<DocumentItem | null>(null);

  const docs = data ?? [];
  const counts = {
    wait: docs.filter((d) => d.status === "wait").length,
    back: docs.filter((d) => d.status === "back").length,
    total: docs.length,
  };

  const act = (action: string, type: "success" | "warn" | "error") => {
    if (selected) {
      pushToast({ title: `${action}เอกสาร`, desc: `${selected.id} ${action}เรียบร้อย`, type });
      setSelected(null);
    }
  };

  return (
    <div>
      <PageHeader title="ศูนย์อนุมัติเอกสาร (Approval Center)" subtitle="เอกสารรออนุมัติ รอเซ็น และตีกลับ พร้อม Checklist และ Timeline" />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="รออนุมัติ" value={counts.wait} icon={Clock} color="amber" />
        <KpiCard label="รอดำเนินการรวม" value={counts.total} icon={FileSignature} color="purple" />
        <KpiCard label="ตีกลับ" value={counts.back} icon={RotateCcw} color="red" />
        <KpiCard label="อนุมัติแล้ว (เดือนนี้)" value={148} icon={CheckCircle2} color="green" />
      </div>

      <Card className="p-5">
        <SectionTitle title="รายการเอกสารรอดำเนินการ" sub="คลิกดูรายละเอียดเพื่ออนุมัติ" />
        {isLoading ? (
          <Skeleton className="h-56" />
        ) : isError ? (
          <ErrorState message={(error as Error)?.message ?? "โหลดข้อมูลไม่สำเร็จ"} onRetry={() => refetch()} />
        ) : docs.length === 0 ? (
          <EmptyState msg="ไม่มีเอกสารรอดำเนินการ" hint="เอกสารทั้งหมดได้รับการอนุมัติแล้ว" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-line dark:border-slate-800">
                  {["รหัส", "ชื่อเอกสาร", "ประเภท", "ผู้จัดทำ", "Checklist", "สถานะ", ""].map((h, i) => (
                    <th key={i} className="px-3 py-2.5 text-left text-[11.5px] font-semibold uppercase tracking-wide text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id} className="border-b border-line/60 hover:bg-surface dark:border-slate-800/60 dark:hover:bg-slate-800/40">
                    <td className="px-3 py-2.5 tnum text-[13px] font-semibold">{d.id}</td>
                    <td className="px-3 py-2.5 text-[13px] font-semibold">{d.title}</td>
                    <td className="px-3 py-2.5"><TagSoft>{d.type}</TagSoft></td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <img src={avatarUrl(d.img)} alt="" className="h-7 w-7 rounded-lg object-cover" />
                        <span className="text-[13px]">{d.owner.split(" ")[0]}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 tnum text-[13px]" style={{ color: d.checkDone === d.checklist ? "#16A34A" : "#F59E0B" }}>{d.checkDone}/{d.checklist}</td>
                    <td className="px-3 py-2.5"><StatusBadge status={d.status} text={d.statusText} /></td>
                    <td className="px-3 py-2.5">
                      <button onClick={() => setSelected(d)} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-brand-600/10 hover:text-brand-600"><Eye className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Drawer open={!!selected} onClose={() => setSelected(null)} title="รายละเอียดเอกสาร">
        {selected && (
          <div>
            <TagSoft>{selected.id}</TagSoft>
            <h3 className="mt-2.5 text-lg font-bold">{selected.title}</h3>
            <p className="text-sm text-muted">{selected.type} · จัดทำโดย {selected.owner}</p>
            <div className="my-4"><StatusBadge status={selected.status} text={selected.statusText} /></div>

            <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted">
              Checklist ความครบถ้วน ({selected.checkDone}/{selected.checklist})
            </h4>
            <div className="space-y-1.5">
              {Array.from({ length: selected.checklist }).map((_, i) => (
                <div key={i} className="flex items-center gap-2.5 text-[13px]">
                  <div className={`grid h-6 w-6 place-items-center rounded-lg ${i < selected.checkDone ? "bg-success/10 text-success" : "bg-warning/15 text-warning"}`}>
                    {i < selected.checkDone ? <Check className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                  </div>
                  <span>รายการตรวจสอบที่ {i + 1}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-xl border-2 border-dashed border-line p-6 text-center text-muted dark:border-slate-700">
              <FileSignature className="mx-auto h-7 w-7" />
              <div className="mt-2 text-xs">พื้นที่สำหรับลายเซ็นดิจิทัล</div>
            </div>

            <div className="mt-5 flex gap-2">
              <Button variant="primary" className="flex-1 justify-center bg-success hover:bg-success/90" onClick={() => act("อนุมัติ", "success")}>
                <Check className="h-4 w-4" /> อนุมัติ
              </Button>
              <Button className="flex-1 justify-center text-warning" onClick={() => act("ตีกลับ", "warn")}>ตีกลับ</Button>
              <Button className="justify-center text-danger" onClick={() => act("ปฏิเสธ", "error")}><X className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
