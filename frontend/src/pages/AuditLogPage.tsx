import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { httpGet } from "@/services/api-client";
import type { AuditLogListResponse } from "@tracking-cyd/shared";
import { Card, PageHeader, SectionTitle, Skeleton, ErrorState, EmptyState } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const COLS = ["เวลา", "ผู้กระทำ", "Role", "Action", "ทรัพยากร", "ผลลัพธ์", "requestId"];

export function AuditLogPage() {
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const q = useQuery({
    queryKey: ["audit-logs", page],
    queryFn: () => httpGet<AuditLogListResponse>(`/audit-logs?page=${page}&pageSize=${pageSize}`),
    retry: 0,
  });
  const rows = q.data?.data ?? [];
  const pg = q.data?.pagination;

  return (
    <div>
      <PageHeader title="Audit Log" subtitle="บันทึกการเข้าสู่ระบบ, Sync, Rebuild และ Action สำคัญ (ผู้ดูแลระบบเท่านั้น)" />
      <Card className="p-5">
        <SectionTitle title="รายการล่าสุด" sub={pg ? `${pg.total} รายการ` : undefined} />
        {q.isLoading ? <Skeleton className="h-72" />
          : q.isError ? <ErrorState message="โหลด Audit Log ไม่สำเร็จ" onRetry={() => q.refetch()} />
          : rows.length === 0 ? <EmptyState msg="ยังไม่มีบันทึก" icon="inbox" />
          : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12.5px]">
                <thead>
                  <tr className="border-b border-line dark:border-slate-800">
                    {COLS.map((h) => <th key={h} className="whitespace-nowrap px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-line/60 dark:border-slate-800/60">
                      <td className="whitespace-nowrap px-3 py-2 tnum text-muted">{new Date(r.createdAt).toLocaleString("th-TH")}</td>
                      <td className="px-3 py-2">{r.actorEmail ?? "—"}</td>
                      <td className="px-3 py-2">{r.actorRole ?? "—"}</td>
                      <td className="px-3 py-2 font-semibold">{r.action}</td>
                      <td className="px-3 py-2">{r.resourceType}{r.resourceId ? `:${r.resourceId}` : ""}</td>
                      <td className={cn("px-3 py-2 font-semibold", r.result === "success" ? "text-success" : "text-danger")}>{r.result}</td>
                      <td className="max-w-[140px] truncate px-3 py-2 tnum text-[11px] text-muted" title={r.requestId}>{r.requestId}</td>
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
      </Card>
    </div>
  );
}
