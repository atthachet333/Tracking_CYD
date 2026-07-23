import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw, ExternalLink, Database, Wifi, WifiOff, Settings2, ArrowRightLeft } from "lucide-react";
import { useSheetStatus, useRefreshSheet, useSyncAdminPKim } from "@/hooks/useApi";
import { sheet1Url } from "@/services/sheets-api";
import { Card, Button } from "@/components/ui/primitives";
import { PermissionGuard } from "@/components/auth/guards";
import { useUiStore } from "@/stores/uiStore";
import { cn } from "@/lib/utils";

function formatSync(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

/** แถบสถานะการเชื่อมต่อ + Sync Now + Auto Refresh (ใช้บนหน้า Dashboard) */
export function SheetConnectionBar() {
  const { data: status, isLoading } = useSheetStatus();
  const refresh = useRefreshSheet();
  const syncPKim = useSyncAdminPKim();
  const pushToast = useUiStore((s) => s.pushToast);
  const qc = useQueryClient();
  const [auto, setAuto] = useState(false);

  const onSyncPKim = () => {
    syncPKim.mutate(undefined, {
      onSuccess: (r) =>
        pushToast({ title: "Sync พี่คิม สำเร็จ", desc: `เขียน ${r.rowsWritten} แถวลง ${r.targetSheet} (อ่าน ${r.rowsRead})`, type: "success" }),
      onError: (e) => pushToast({ title: "Sync ไม่สำเร็จ", desc: (e as Error).message, type: "error" }),
    });
  };

  useEffect(() => {
    if (!auto) return;
    const id = window.setInterval(() => void qc.invalidateQueries(), 60_000);
    return () => window.clearInterval(id);
  }, [auto, qc]);

  const onSync = () => {
    refresh.mutate(undefined, {
      onSuccess: (s) => pushToast({ title: "ซิงก์สำเร็จ", desc: `อ่านข้อมูล ${s.rowCount} แถวจาก Google Sheets`, type: "success" }),
      onError: (e) => pushToast({ title: "ซิงก์ไม่สำเร็จ", desc: (e as Error).message, type: "error" }),
    });
  };

  const connected = status?.connected ?? false;
  const configured = status?.configured ?? false;
  // ปุ่มเปิดต้องชี้ไป Sheet 1 (ปลายทาง) พร้อม gid=0 เสมอ ไม่ใช่ Sheet 2 (ต้นทาง)
  const url = sheet1Url(status?.target?.spreadsheetId);

  return (
    <Card className="mb-4 flex flex-wrap items-center gap-3 p-4">
      <div className={cn("grid h-10 w-10 place-items-center rounded-xl", connected ? "bg-success/10 text-success" : configured ? "bg-warning/15 text-warning" : "bg-slate-100 text-slate-400 dark:bg-slate-800")}>
        <Database className="h-5 w-5" />
      </div>
      <div className="min-w-[180px] flex-1">
        <div className="flex items-center gap-2 text-sm font-semibold">
          {connected ? <Wifi className="h-4 w-4 text-success" /> : <WifiOff className="h-4 w-4 text-muted" />}
          {isLoading ? "กำลังตรวจสอบการเชื่อมต่อ..." : connected ? `เชื่อมต่อแล้ว · ${status?.sheetTitle ?? ""}` : configured ? "เชื่อมต่อไม่สำเร็จ" : "ยังไม่ได้ตั้งค่าการเชื่อมต่อ"}
        </div>
        <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted">
          <span>ต้นทาง: <b className={status?.source?.connected ? "text-success" : "text-muted"}>{status?.source?.spreadsheetTitle ?? "—"}</b></span>
          <span>ปลายทาง: <b className={status?.target?.connected ? "text-success" : "text-muted"}>{status?.target?.spreadsheetTitle ?? "—"}</b></span>
          <span>ซิงก์ล่าสุด: <span className="tnum">{formatSync(status?.lastSyncAt ?? null)}</span></span>
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
        <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} className="h-4 w-4 accent-brand-600" />
        Auto Refresh (60s)
      </label>

      {url && (
        <a href={url} target="_blank" rel="noopener noreferrer">
          <Button><ExternalLink className="h-4 w-4" /> เปิด Google Sheet</Button>
        </a>
      )}
      <PermissionGuard permission="integrationManage"><SettingsLink /></PermissionGuard>
      {/* รีเฟรช = read-only (executive ใช้ได้) */}
      <Button onClick={onSync} className={cn(refresh.isPending && "opacity-70")}>
        <RefreshCw className={cn("h-4 w-4", refresh.isPending && "animate-spin")} /> รีเฟรช
      </Button>
      {/* Sync = เขียน ADMIN (admin เท่านั้น) */}
      <PermissionGuard permission="syncExecute">
        <Button variant="primary" onClick={onSyncPKim} className={cn(syncPKim.isPending && "opacity-70")}>
          <ArrowRightLeft className={cn("h-4 w-4", syncPKim.isPending && "animate-spin")} /> Sync พี่คิม → ADMIN
        </Button>
      </PermissionGuard>
    </Card>
  );
}

function SettingsLink() {
  const navigate = useNavigate();
  return (
    <Button onClick={() => navigate("/dashboard/settings/integrations/google-sheets")}>
      <Settings2 className="h-4 w-4" /> ตั้งค่า
    </Button>
  );
}

/** Empty state เมื่อยังไม่มีข้อมูล/ยังไม่เชื่อมต่อ */
export function SheetEmptyState() {
  const { data: status } = useSheetStatus();
  const refresh = useRefreshSheet();
  const navigate = useNavigate();
  const pushToast = useUiStore((s) => s.pushToast);
  const url = sheet1Url(status?.target?.spreadsheetId);
  const configured = status?.configured ?? false;

  return (
    <Card className="p-10 text-center">
      <Database className="mx-auto h-14 w-14 text-slate-300 dark:text-slate-600" strokeWidth={1.5} />
      <h3 className="mt-4 text-lg font-bold">
        {configured ? "ยังไม่มีข้อมูลใน Google Sheets" : "ยังไม่ได้ตั้งค่าการเชื่อมต่อ Google Sheets"}
      </h3>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-muted">
        {configured
          ? "เพิ่มข้อมูลในชีตแล้วกดรีเฟรชเพื่ออัปเดต Dashboard — ระบบจะไม่แสดงข้อมูลตัวอย่าง"
          : "ตั้งค่า Service Account ใน backend/.env และแชร์ชีตให้ Service Account (Viewer) จากนั้นตรวจสอบการเชื่อมต่อ"}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2.5">
        {url && (
          <a href={url} target="_blank" rel="noopener noreferrer">
            <Button><ExternalLink className="h-4 w-4" /> เปิด Google Sheets</Button>
          </a>
        )}
        <Button
          variant="primary"
          onClick={() =>
            refresh.mutate(undefined, {
              onSuccess: (s) => pushToast({ title: "รีเฟรชสำเร็จ", desc: `อ่านข้อมูล ${s.rowCount} แถว`, type: "success" }),
              onError: (e) => pushToast({ title: "รีเฟรชไม่สำเร็จ", desc: (e as Error).message, type: "error" }),
            })
          }
        >
          <RefreshCw className={cn("h-4 w-4", refresh.isPending && "animate-spin")} /> รีเฟรชข้อมูล
        </Button>
        <Button onClick={() => navigate("/dashboard/settings/integrations/google-sheets")}>
          <Settings2 className="h-4 w-4" /> ตรวจสอบการเชื่อมต่อ
        </Button>
      </div>
    </Card>
  );
}
