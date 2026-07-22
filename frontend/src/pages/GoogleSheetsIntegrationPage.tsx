import { useState } from "react";
import { ExternalLink, RefreshCw, PlugZap, CheckCircle2, XCircle, AlertTriangle, ArrowRightLeft, PieChart } from "lucide-react";
import { useSheetStatus, useSheetMetadata, useSheetHeaders, useRefreshSheet, useSyncAdmin, useSyncAdminAll, useSheetSummary, useRebuildSummary } from "@/hooks/useApi";
import type { SheetSummary, SyncAllResult, SyncResult, SyncSourceFailure } from "@/types";
import { sheet1Url, maskId } from "@/services/sheets-api";
import { Card, PageHeader, SectionTitle, Button, Skeleton, TagSoft } from "@/components/ui/primitives";
import { DocumentsIntegrationPanel } from "@/components/documents-dashboard/DocumentsIntegrationPanel";
import { useUiStore } from "@/stores/uiStore";
import { cn } from "@/lib/utils";

const ADMIN_SYNC_SOURCES = [
  { slug: "p-kim", label: "พี่คิม" },
  { slug: "am", label: "แอม" },
  { slug: "p-vee", label: "พี่วี" },
  { slug: "p-ann", label: "พี่แอน" },
] as const;

type SyncRow = SyncResult | SyncSourceFailure;

export function GoogleSheetsIntegrationPage() {
  const status = useSheetStatus();
  const configured = status.data?.configured ?? false;
  const connected = status.data?.connected ?? false;
  const metadata = useSheetMetadata(configured);
  const headers = useSheetHeaders(connected);
  const refresh = useRefreshSheet();
  const syncAdmin = useSyncAdmin();
  const syncAdminAll = useSyncAdminAll();
  const pushToast = useUiStore((s) => s.pushToast);
  const [lastResults, setLastResults] = useState<SyncRow[]>([]);

  const url = sheet1Url(status.data?.target?.spreadsheetId);
  const tab = metadata.data?.sheets.find((s) => s.sheetId === (status.data?.sheetId ?? 0));

  const testConnection = async () => {
    const res = await status.refetch();
    if (res.data?.connected) pushToast({ title: "เชื่อมต่อสำเร็จ", desc: `อ่าน ${res.data.rowCount} แถว`, type: "success" });
    else if (res.data?.configured) pushToast({ title: "เชื่อมต่อไม่สำเร็จ", desc: "ตรวจสอบการแชร์ชีตให้ Service Account", type: "error" });
    else pushToast({ title: "ยังไม่ได้ตั้งค่า", desc: "กรอก credential ใน backend/.env", type: "warn" });
  };

  const onRefresh = () =>
    refresh.mutate(undefined, {
      onSuccess: (s) => pushToast({ title: "Refresh สำเร็จ", desc: `อ่าน ${s.rowCount} แถว`, type: "success" }),
      onError: (e) => pushToast({ title: "Refresh ไม่สำเร็จ", desc: (e as Error).message, type: "error" }),
    });

  const onSyncAdmin = (slug: string, label: string) =>
    syncAdmin.mutate(slug, {
      onSuccess: (r) => {
        setLastResults([r]);
        pushToast({ title: `Sync ${label} สำเร็จ`, desc: `เขียน ${r.rowsWritten} แถวลง ${r.targetSheet}`, type: "success" });
      },
      onError: (e) => pushToast({ title: "Sync ไม่สำเร็จ", desc: (e as Error).message, type: "error" }),
    });

  const onSyncAdminAll = () =>
    syncAdminAll.mutate(undefined, {
      onSuccess: (r: SyncAllResult) => {
        setLastResults(r.results);
        pushToast({
          title: r.success ? "Sync all สำเร็จ" : "Sync all สำเร็จบางส่วน",
          desc: `${r.results.filter((item) => item.success).length}/${r.results.length} sources`,
          type: r.success ? "success" : "warn",
        });
      },
      onError: (e) => pushToast({ title: "Sync all ไม่สำเร็จ", desc: (e as Error).message, type: "error" }),
    });

  return (
    <div>
      <PageHeader
        title="การเชื่อมต่อ Google Sheets"
        subtitle="ตรวจสถานะ source/target และ sync ข้อมูลลงแท็บ ADMIN"
        actions={
          <>
            <Button onClick={testConnection}><PlugZap className="h-4 w-4" /> Test Connection</Button>
            {url && (
              <a href={url} target="_blank" rel="noopener noreferrer">
                <Button><ExternalLink className="h-4 w-4" /> เปิด Google Sheet</Button>
              </a>
            )}
            <Button variant="primary" onClick={onRefresh}><RefreshCw className={cn("h-4 w-4", refresh.isPending && "animate-spin")} /> Refresh</Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <SectionTitle title="สถานะการเชื่อมต่อ" />
          {status.isLoading ? (
            <Skeleton className="h-40" />
          ) : (
            <div className="space-y-2.5 text-sm">
              <StatusRow label="Configured" ok={configured} />
              <StatusRow label="Connected" ok={connected} />
              <Row label="Spreadsheet ID" value={maskId(status.data?.spreadsheetId ?? null)} mono />
              <Row label="Sheet Title" value={status.data?.sheetTitle ?? "-"} />
              <Row label="Sheet ID (GID)" value={String(status.data?.sheetId ?? "-")} mono />
              <Row label="Row Count" value={String(status.data?.rowCount ?? 0)} mono />
              <Row label="Column Count" value={tab ? String(tab.columnCount) : "-"} mono />
              <Row label="Last Sync" value={status.data?.lastSyncAt ? new Date(status.data.lastSyncAt).toLocaleString("th-TH") : "-"} />
            </div>
          )}
          {!configured && (
            <div className="mt-4 rounded-xl bg-warning/10 p-3 text-xs text-amber-700 dark:text-amber-400">
              ยังไม่ได้ตั้งค่า credential ใน backend/.env
            </div>
          )}
        </Card>

        <Card className="p-5">
          <SectionTitle title="Header Mapping" sub="map ตามชื่อคอลัมน์" />
          {!connected ? (
            <div className="py-6 text-center text-sm text-muted">เชื่อมต่อสำเร็จก่อนจึงจะแสดง mapping ได้</div>
          ) : headers.isLoading ? (
            <Skeleton className="h-40" />
          ) : headers.data ? (
            <div className="space-y-2">
              {Object.entries(headers.data.mapping).map(([field, header]) => (
                <div key={field} className="flex items-center justify-between text-[13px]">
                  <span className="tnum text-muted">{field}</span>
                  {header ? (
                    <span className="inline-flex items-center gap-1.5 font-semibold text-success"><CheckCircle2 className="h-3.5 w-3.5" /> {header}</span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-warning"><AlertTriangle className="h-3.5 w-3.5" /> ยังไม่ได้ map</span>
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </Card>
      </div>

      <Card className="mb-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle title="Sync ต้นทาง → ADMIN" sub="รายคนแทนเฉพาะ source_sheet ของตัวเอง; Sync all ทำทีละ source" />
          <div className="flex flex-wrap gap-2">
            {ADMIN_SYNC_SOURCES.map((source) => (
              <Button key={source.slug} onClick={() => onSyncAdmin(source.slug, source.label)} className={syncAdmin.isPending ? "opacity-70" : ""}>
                <ArrowRightLeft className={cn("h-4 w-4", syncAdmin.isPending && "animate-spin")} /> {source.label}
              </Button>
            ))}
            <Button variant="primary" onClick={onSyncAdminAll} className={syncAdminAll.isPending ? "opacity-70" : ""}>
              <RefreshCw className={cn("h-4 w-4", syncAdminAll.isPending && "animate-spin")} /> Sync all
            </Button>
          </div>
        </div>

        <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SheetList title="ต้นทาง" ok={status.data?.source?.connected ?? false} name={status.data?.source?.spreadsheetTitle ?? "-"} sheets={status.data?.source?.sheets ?? []} />
          <SheetList title="ปลายทาง" ok={status.data?.target?.connected ?? false} name={status.data?.target?.spreadsheetTitle ?? "-"} sheets={status.data?.target?.sheets ?? []} />
        </div>

        {lastResults.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-line text-left text-muted dark:border-slate-800">
                  {["source", "status", "rowsRead", "rowsWritten", "skipped", "duplicateRows"].map((h) => (
                    <th key={h} className="px-3 py-2 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lastResults.map((result) => (
                  <tr key={result.slug} className="border-b border-line/60 dark:border-slate-800/60">
                    <td className="px-3 py-2 font-semibold">{result.sourceSheet}</td>
                    <td className={cn("px-3 py-2", result.success ? "text-success" : "text-danger")}>{result.success ? "success" : result.error.message}</td>
                    <td className="px-3 py-2 tnum">{result.success ? result.rowsRead : "-"}</td>
                    <td className="px-3 py-2 tnum">{result.success ? result.rowsWritten : "-"}</td>
                    <td className="px-3 py-2 tnum">{result.success ? result.emptyRowsSkipped + result.repeatedHeadersSkipped + result.invalidRowsSkipped : "-"}</td>
                    <td className="px-3 py-2 tnum">{result.success ? result.duplicateRows : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <SummarySection connected={connected} />

      <DocumentsIntegrationPanel />

      {connected && headers.data && headers.data.warnings.length > 0 && (
        <Card className="p-5">
          <SectionTitle title="Validation Warnings" />
          <div className="space-y-2">
            {headers.data.warnings.map((w, i) => (
              <div key={i} className="flex items-center gap-2 text-[13px] text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" /> <TagSoft>{w.field}</TagSoft> {w.message}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function SummarySection({ connected }: { connected: boolean }) {
  const summary = useSheetSummary(connected);
  const rebuild = useRebuildSummary();
  const pushToast = useUiStore((s) => s.pushToast);

  const onRebuild = () =>
    rebuild.mutate(undefined, {
      onSuccess: (s: SheetSummary) =>
        pushToast({ title: "สร้างสรุปสำเร็จ", desc: `เขียน ${s.totalCases} เคสลงแท็บ ${s.targetSheet ?? "SUMMARY"}`, type: "success" }),
      onError: (e) => pushToast({ title: "สร้างสรุปไม่สำเร็จ", desc: (e as Error).message, type: "error" }),
    });

  const data = summary.data;

  return (
    <Card className="mb-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle title="สรุปยอดจาก Sheet 2 (ต้นทาง)" sub="รวมทุกผู้รับผิดชอบ แล้วเขียนลงแท็บ SUMMARY ของ Sheet 1" />
        <Button variant="primary" onClick={onRebuild} className={rebuild.isPending ? "opacity-70" : ""}>
          <PieChart className={cn("h-4 w-4", rebuild.isPending && "animate-spin")} /> คำนวณ + เขียนลง Sheet 1
        </Button>
      </div>

      {!connected ? (
        <div className="py-6 text-center text-sm text-muted">เชื่อมต่อสำเร็จก่อนจึงจะสรุปยอดได้</div>
      ) : summary.isLoading ? (
        <Skeleton className="mt-3 h-40" />
      ) : data ? (
        <div className="mt-3 space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="เคสทั้งหมด" value={data.totalCases} />
            <Metric label="ทำใบเสนอราคา" value={data.quotedCount} />
            <Metric label="มีมัดจำ" value={data.depositCount} />
            <Metric label="มีสัญญา" value={data.contractCount} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <MetricTable title="ตามผู้รับผิดชอบ" head="ผู้รับผิดชอบ" rows={data.byAssignee} />
            <MetricTable title="ตามสถานะลูกค้า" head="สถานะ" rows={data.byCustomerStatus} />
          </div>

          <div className="flex flex-wrap gap-1.5 text-xs">
            {data.sources.map((s) => (
              <span key={s.slug} className={cn("inline-flex items-center gap-1 rounded-lg px-2 py-1", s.ok ? "bg-success/10 text-success" : "bg-danger/10 text-danger")}>
                {s.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                {s.sourceSheet} {s.ok ? `· ${s.rowsRead} แถว` : `· ${s.error ?? "อ่านไม่สำเร็จ"}`}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="py-6 text-center text-sm text-muted">ยังไม่มีข้อมูลสรุป — กด "คำนวณ" เพื่อดึงจาก Sheet 2</div>
      )}
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line p-3 dark:border-slate-800">
      <div className="text-xs text-muted">{label}</div>
      <div className="tnum mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}

function MetricTable({ title, head, rows }: { title: string; head: string; rows: { key: string; label: string; count: number }[] }) {
  return (
    <div className="rounded-xl border border-line p-3.5 dark:border-slate-800">
      <div className="mb-2 text-sm font-semibold">{title}</div>
      {rows.length === 0 ? (
        <div className="text-xs text-muted">—</div>
      ) : (
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-muted">
              <th className="py-1 font-semibold">{head}</th>
              <th className="py-1 text-right font-semibold">จำนวน</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-t border-line/60 dark:border-slate-800/60">
                <td className="py-1">{r.label}</td>
                <td className="tnum py-1 text-right font-semibold">{r.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function SheetList({ title, ok, name, sheets }: { title: string; ok: boolean; name: string; sheets: string[] }) {
  return (
    <div className="rounded-xl border border-line p-3.5 dark:border-slate-800">
      <div className="mb-1.5 flex items-center gap-2 text-sm font-semibold">
        {ok ? <CheckCircle2 className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-danger" />}
        {title} · {name}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {sheets.map((s) => <TagSoft key={s}>{s}</TagSoft>)}
        {sheets.length === 0 && <span className="text-xs text-muted">-</span>}
      </div>
    </div>
  );
}

function StatusRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span className={cn("inline-flex items-center gap-1.5 font-semibold", ok ? "text-success" : "text-danger")}>
        {ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
        {ok ? "ใช่" : "ไม่"}
      </span>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span className={cn("font-semibold", mono && "tnum")}>{value}</span>
    </div>
  );
}
