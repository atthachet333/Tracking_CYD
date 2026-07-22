import { useNavigate } from "react-router-dom";
import { Database, Wifi, RefreshCw, ExternalLink, Settings2, AlertTriangle } from "lucide-react";
import type { CustomerDashboardMeta } from "@/types/customer-dashboard";
import { Button } from "@/components/ui/primitives";
import { sheet1Url } from "@/services/sheets-api";
import { cn } from "@/lib/utils";

function fmt(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

interface Props {
  meta?: CustomerDashboardMeta;
  isRefreshing: boolean;
  onRefresh: () => void;
}

/** การ์ดสถานะแหล่งข้อมูล Google Sheets + Refresh + เปิดหน้า Integration */
export function DataSourceStatus({ meta, isRefreshing, onRefresh }: Props) {
  const navigate = useNavigate();
  const connected = Boolean(meta && meta.rowsRead > 0);

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className={cn("grid h-10 w-10 place-items-center rounded-xl", connected ? "bg-success/10 text-success" : "bg-slate-100 text-slate-400 dark:bg-slate-800")}>
          <Database className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <Wifi className={cn("h-4 w-4", connected ? "text-success" : "text-muted")} />
            {connected ? "เชื่อมต่อ Google Sheets แล้ว" : "ยังไม่มีข้อมูล"}
          </div>
          <div className="mt-0.5 text-xs text-muted">
            แท็บ gid <b className="tnum">{meta?.sheetId ?? "—"}</b> · {meta?.sheetTitle ?? "—"}
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-1.5 text-[13px]">
        <Row label="แท็บที่รวมข้อมูล" value={meta?.tabsAggregated.join(", ") || "—"} />
        <Row label="จำนวนแถวที่อ่าน" value={meta ? String(meta.rowsRead) : "—"} mono />
        <Row label="อัปเดตล่าสุด" value={fmt(meta?.lastUpdatedAt ?? null)} />
        <Row label="Spreadsheet" value={meta?.spreadsheetId ?? "—"} mono />
      </div>

      {meta && meta.warnings.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {meta.warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-1.5 rounded-lg bg-warning/10 p-2 text-[11.5px] text-amber-700 dark:text-amber-400">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3.5 flex flex-wrap gap-2">
        <Button onClick={onRefresh} className={cn(isRefreshing && "opacity-70")}>
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} /> รีเฟรช
        </Button>
        <a href={sheet1Url(null)} target="_blank" rel="noopener noreferrer">
          <Button><ExternalLink className="h-4 w-4" /> เปิด Google Sheet</Button>
        </a>
        <Button onClick={() => navigate("/dashboard/settings/integrations/google-sheets")}>
          <Settings2 className="h-4 w-4" /> หน้าเชื่อมต่อ
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span className={cn("truncate text-right font-semibold", mono && "tnum")}>{value}</span>
    </div>
  );
}
